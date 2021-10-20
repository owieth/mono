import React, {useState} from "react"
import {useMediaQuery} from "react-responsive"
import _ from "lodash"
import BigNumber from "bignumber.js"
import {MerkleDistributorGrantInfo} from "@goldfinch-eng/protocol/blockchain_scripts/merkleDistributor/types"
import {gfiFromAtomic} from "../ethereum/gfi"
import {WIDTH_TYPES} from "./styleConstants"
import {MerkleDistributor, CommunityRewardsVesting, CommunityRewards} from "../ethereum/communityRewards"
import {StakingRewards, StakedPosition} from "../ethereum/pool"
import useSendFromUser from "../hooks/useSendFromUser"
import {displayNumber, displayDollars} from "../utils"
import {iconCarrotDown} from "./icons"
import LoadingButton from "./loadingButton"
import TransactionForm from "./transactionForm"

interface ActionButtonProps {
  text: string
  disabled: boolean
  pendingText?: string
  onClick: () => void
}

function ActionButton(props: ActionButtonProps) {
  const [isPending, setIsPending] = useState<boolean>(false)
  const isTabletOrMobile = useMediaQuery({query: `(max-width: ${WIDTH_TYPES.screenL})`})
  const disabledClass = props.disabled || isPending ? "disabled-button" : ""

  async function action() {
    setIsPending(true)
    await props.onClick()
    setIsPending(false)
  }

  return (
    <button className={`${!isTabletOrMobile && "table-cell"} action ${disabledClass}`} onClick={action}>
      {isPending && props.pendingText ? props.pendingText : props.text}
    </button>
  )
}

interface ClaimFormProps {
  totalUSD: BigNumber
  claimable: BigNumber
  disabled: boolean
  onClose: () => void
  action: () => void
}

function ClaimForm(props: ClaimFormProps) {
  function renderForm({formMethods}) {
    return (
      <div className="info-banner background-container subtle">
        <div className="message">
          Claim the total available {displayNumber(gfiFromAtomic(props.claimable), 2)} GFI ($
          {displayDollars(props.totalUSD)}&nbsp;) that has vested.
        </div>
        <LoadingButton text="Submit" action={props.action} disabled={props.disabled} />
      </div>
    )
  }

  return <TransactionForm headerMessage="Claim" render={renderForm} closeForm={props.onClose} />
}

enum RewardStatus {
  Accept,
  Claim,
  Finished,
}

interface RewardsListItemProps {
  title: string
  grantedGFI: BigNumber
  claimableGFI: BigNumber
  status: RewardStatus
  handleOnClick: () => void
}

function RewardsListItem(props: RewardsListItemProps) {
  const isTabletOrMobile = useMediaQuery({query: `(max-width: ${WIDTH_TYPES.screenL})`})
  const valueDisabledClass = props.status === RewardStatus.Accept ? "disabled-text" : ""

  const actionButtonComponent =
    props.status === RewardStatus.Accept ? (
      <ActionButton text="Accept" onClick={props.handleOnClick} disabled={false} />
    ) : props.status === RewardStatus.Claim ? (
      <ActionButton text="Claim GFI" onClick={props.handleOnClick} disabled={props.claimableGFI.eq(0)} />
    ) : (
      <ActionButton text="Claimed" onClick={props.handleOnClick} disabled />
    )

  return (
    <>
      {!isTabletOrMobile && (
        <li className="rewards-list-item table-row background-container clickable">
          <div className="table-cell col32">{props.title}</div>
          <div className={`table-cell col20 numeric ${valueDisabledClass}`}>
            {displayNumber(gfiFromAtomic(props.grantedGFI), 2)}
          </div>
          <div className={`table-cell col20 numeric ${valueDisabledClass}`}>
            {displayNumber(gfiFromAtomic(props.claimableGFI), 2)}
          </div>
          {actionButtonComponent}
          <button className="expand">{iconCarrotDown}</button>
        </li>
      )}

      {isTabletOrMobile && (
        <li className="rewards-list-item background-container clickable mobile">
          <div className="item-header">
            <div>{props.title}</div>
            <button className="expand">{iconCarrotDown}</button>
          </div>
          <div className="item-details">
            <div className="detail-container">
              <span className="detail-label">Granted GFI</span>
              <div className={`${valueDisabledClass}`}>{displayNumber(gfiFromAtomic(props.grantedGFI), 2)}</div>
            </div>
            <div className="detail-container">
              <span className="detail-label">Claimable GFI</span>
              <div className={`${valueDisabledClass}`}>{displayNumber(gfiFromAtomic(props.claimableGFI), 2)}</div>
            </div>
          </div>
          {actionButtonComponent}
        </li>
      )}
    </>
  )
}

interface RewardActionsContainerProps {
  merkleDistributor: MerkleDistributor
  stakingRewards: StakingRewards
  item: CommunityRewardsVesting | StakedPosition | MerkleDistributorGrantInfo
}

function RewardActionsContainer(props: RewardActionsContainerProps) {
  const sendFromUser = useSendFromUser()
  const [showAction, setShowAction] = useState<boolean>(false)

  function closeForm() {
    setShowAction(false)
  }

  async function handleClaim(
    rewards: CommunityRewards | StakingRewards | undefined,
    tokenId: string,
    amount: BigNumber
  ) {
    if (!rewards) return

    const amountString = amount.toString(10)
    return sendFromUser(rewards.contract.methods.getReward(tokenId), {
      type: "Claim",
      amount: amountString,
    })
  }

  async function handleAccept(info) {
    if (!props.merkleDistributor) return
    return sendFromUser(
      props.merkleDistributor.contract.methods.acceptGrant(
        info.index,
        info.account,
        info.grant.amount,
        info.grant.vestingLength,
        info.grant.cliffLength,
        info.grant.vestingInterval,
        info.proof
      ),
      {
        type: "Accept",
        amount: gfiFromAtomic(info.grant.amount),
      }
    )
  }

  function capitalizeReason(reason: string): string {
    return reason
      .split("_")
      .map((s) => _.capitalize(s))
      .join(" ")
  }

  if (props.item instanceof CommunityRewardsVesting || props.item instanceof StakedPosition) {
    const item = props.item
    const title = item instanceof StakedPosition ? item.reason : capitalizeReason(item.reason)

    if (item.rewards.totalClaimed.isEqualTo(item.granted) && !item.granted.eq(0)) {
      return (
        <RewardsListItem
          key={`reward-${item.rewards.startTime}`}
          status={RewardStatus.Finished}
          title={title}
          grantedGFI={item.granted}
          claimableGFI={item.claimable}
          handleOnClick={_.noop}
        />
      )
    } else if (item instanceof CommunityRewardsVesting && !showAction) {
      return (
        <RewardsListItem
          key={`reward-${item.rewards.startTime}`}
          status={RewardStatus.Claim}
          title={title}
          grantedGFI={item.granted}
          claimableGFI={item.claimable}
          handleOnClick={() => setShowAction(true)}
        />
      )
    } else if (item instanceof StakedPosition && !showAction) {
      return (
        <RewardsListItem
          key={`reward-${item.rewards.startTime}`}
          status={RewardStatus.Claim}
          title={title}
          grantedGFI={item.granted}
          claimableGFI={item.claimable}
          handleOnClick={() => setShowAction(true)}
        />
      )
    }

    const reward = item instanceof StakedPosition ? props.stakingRewards : props.merkleDistributor.communityRewards
    return (
      <ClaimForm
        action={() => handleClaim(reward, item.tokenId, item.claimable)}
        disabled={item.claimable.eq(0)}
        claimable={item.claimable}
        totalUSD={new BigNumber("")} // TODO: this needs to be updated once we have a price for GFI in USD.
        onClose={closeForm}
      />
    )
  } else {
    const title = capitalizeReason(props.item.reason)
    return (
      <RewardsListItem
        key={`${props.item.reason}-${props.item.index}`}
        status={RewardStatus.Accept}
        title={title}
        grantedGFI={new BigNumber(props.item.grant.amount)}
        claimableGFI={new BigNumber(0)}
        handleOnClick={() => handleAccept(props.item)}
      />
    )
  }
}

export default RewardActionsContainer
