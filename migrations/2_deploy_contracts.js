const ATM = artifacts.require("ATM");

module.exports = function(deployer) {
  deployer.deploy(ATM);
};
