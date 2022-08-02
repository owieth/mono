import { gql } from "@apollo/client";
import { BigNumber } from "ethers";
import { useMemo } from "react";

import { Heading, Stat, StatGrid } from "@/components/design-system";
import { formatCrypto } from "@/lib/format";
import { SupportedCrypto, useGfiPageQuery } from "@/lib/graphql/generated";
import { useWallet } from "@/lib/wallet";

import { BackerCard, BACKER_CARD_TOKEN_FIELDS } from "./backer-card";
import {
  GrantCard,
  GRANT_CARD_GRANT_FIELDS,
  GRANT_CARD_TOKEN_FIELDS,
} from "./grant-card";

gql`
  ${GRANT_CARD_GRANT_FIELDS}
  ${GRANT_CARD_TOKEN_FIELDS}
  ${BACKER_CARD_TOKEN_FIELDS}

  query GfiPage($userId: String!) {
    viewer @client {
      gfiGrants {
        ...GrantCardGrantFields
      }
    }
    communityRewardsTokens(where: { user: $userId }) {
      ...GrantCardTokenFields
    }
    tranchedPoolTokens(where: { user: $userId }) {
      ...BackerCardTokenFields
    }
  }
`;

export default function GfiPage() {
  const { account } = useWallet();
  const { data } = useGfiPageQuery({
    variables: {
      userId: account ? account.toLowerCase() : "",
    },
    skip: !account,
  });

  const grantsWithTokens = useMemo(() => {
    if (data?.viewer.gfiGrants && data?.communityRewardsTokens) {
      const gfiGrants = data.viewer.gfiGrants;
      const communityRewardsTokens = data.communityRewardsTokens;
      const grantsWithTokens = [];
      for (const grant of gfiGrants) {
        const correspondingToken = communityRewardsTokens.find(
          (token) =>
            token.source.toString() === grant.source.toString() &&
            token.index === grant.index
        );
        grantsWithTokens.push({
          grant: grant,
          token: correspondingToken,
          locked:
            grant.__typename === "DirectGfiGrant"
              ? BigNumber.from(0)
              : grant.amount.sub(grant.vested),
          claimable:
            grant.__typename === "DirectGfiGrant"
              ? grant.isAccepted
                ? BigNumber.from(0)
                : grant.amount
              : grant.vested.sub(correspondingToken?.totalClaimed ?? 0),
        });
      }
      return grantsWithTokens;
    }
  }, [data]);

  const totalClaimable =
    grantsWithTokens?.reduce(
      (prev, current) => prev.add(current.claimable),
      BigNumber.from(0)
    ) ?? BigNumber.from(0);
  const totalLocked =
    grantsWithTokens?.reduce(
      (prev, current) => prev.add(current.locked),
      BigNumber.from(0)
    ) ?? BigNumber.from(0);

  return (
    <div>
      <Heading level={1} className="mb-12 text-7xl">
        GFI
      </Heading>
      {!account ? (
        <div>You must connect your wallet to view GFI rewards</div>
      ) : (
        <div>
          <StatGrid className="mb-15">
            <Stat
              label="Total GFI (Claimable + Locked)"
              value={formatCrypto(
                {
                  token: SupportedCrypto.Gfi,
                  amount: totalClaimable.add(totalLocked),
                },
                { includeToken: true }
              )}
              tooltip="Lorem ipsum"
            />
            <Stat
              label="Claimable GFI"
              value={formatCrypto(
                { token: SupportedCrypto.Gfi, amount: totalClaimable },
                { includeToken: true }
              )}
            />
            <Stat
              label="Locked GFI"
              value={formatCrypto(
                { token: SupportedCrypto.Gfi, amount: totalLocked },
                { includeToken: true }
              )}
            />
          </StatGrid>
          <div
            className="mb-3 grid px-6 text-sand-500"
            style={{
              gridTemplateColumns: "1fr 20% 20% 25%",
              alignItems: "center",
            }}
          >
            <div>Type</div>
            <div className="justify-self-end">Locked GFI</div>
            <div className="justify-self-end">Claimable GFI</div>
            <div></div>
          </div>
          <div className="space-y-3">
            {data?.tranchedPoolTokens.map((token) => (
              <BackerCard key={token.id} token={token} />
            ))}
            {grantsWithTokens?.map(
              ({ grant, token, claimable, locked }, index) => (
                <GrantCard
                  key={index}
                  grant={grant}
                  token={token}
                  claimable={claimable}
                  locked={locked}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
