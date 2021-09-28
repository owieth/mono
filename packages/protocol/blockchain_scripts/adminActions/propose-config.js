const {CHAIN_NAME_BY_ID, assertIsChainId} = require("../deployHelpers")
const hre = require("hardhat")
const {DefenderUpgrader} = require("../upgrade")

let logger = console.log

async function main() {
  await proposeConfig(hre)
}

async function proposeConfig(hre, oldConfigAddress) {
  oldConfigAddress = oldConfigAddress || process.env.OLD_CONFIG_ADDRESS
  if (!oldConfigAddress) {
    throw new Error("You must pass OLD_CONFIG_ADDRESS as an envvar")
  }

  let newConfig = await hre.deployments.get("GoldfinchConfig")
  let newConfigAddress = newConfig.address

  if (oldConfigAddress.toLowerCase() === newConfigAddress.toLowerCase()) {
    throw new Error(
      `Old config address ${oldConfigAddress} and new config address ${newConfigAddress} are the same. Make sure a new GoldfinchConfig has been deployed and is reflected in the deployment files.`
    )
  }

  const chainId = await hre.getChainId()
  assertIsChainId(chainId)
  const network = CHAIN_NAME_BY_ID[chainId]
  let defender = new DefenderUpgrader({hre, logger, chainId, network})
  await defender.setNewConfigAddress(oldConfigAddress, newConfigAddress)
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = {proposeConfig}