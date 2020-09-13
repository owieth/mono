const BN = require('bn.js');
// Using 1e6, because that's what USDC is.
const USDCDecimals = new BN(String(1e6));
const ETHDecimals = new BN(String(1e18));

const ROPSTEN_USDC_ADDRESS = "0x07865c6e87b9f70255377e024ace6630c1eaa37f";
const MAINNET_USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const LOCAL = "local";
const ROPSTEN = "ropsten";
const RINKEBY = "rinkeby";
const MAINNET = "mainnet";
const MAX_UINT = new BN("115792089237316195423570985008687907853269984665640564039457584007913129639935");
const CHAIN_MAPPING = {
  "31337": LOCAL,
  "3": ROPSTEN,
  "1": MAINNET,
  "4": RINKEBY,
}
const USDC_MAPPING = {
  [ROPSTEN]: ROPSTEN_USDC_ADDRESS,
  [MAINNET]: MAINNET_USDC_ADDRESS
}
const MULTISIG_MAPPING = {
  [RINKEBY]: "0xcF0B329c04Fd92a7370de10458050Fc8124Cacbc",
}
function getUSDCAddress(chainID) {
  return USDC_MAPPING[chainID] || USDC_MAPPING[CHAIN_MAPPING[chainID]];
}

function getMultisigAddress(chainID) {
  return MULTISIG_MAPPING[chainID] || MULTISIG_MAPPING[CHAIN_MAPPING[chainID]];
}

module.exports = {
  CHAIN_MAPPING: CHAIN_MAPPING,
  ROPSTEN_USDC_ADDRESS: ROPSTEN_USDC_ADDRESS,
  LOCAL: LOCAL,
  MAINNET: MAINNET,
  USDCDecimals: USDCDecimals,
  MAX_UINT: MAX_UINT,
  ETHDecimals: ETHDecimals,
  getMultisigAddress: getMultisigAddress,
  getUSDCAddress: getUSDCAddress,
}