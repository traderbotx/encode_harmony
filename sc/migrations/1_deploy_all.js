const Warrior = artifacts.require("Warrior");
const Kingdom = artifacts.require("Kingdom");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Kingdom);
  const kingdomSC = await Kingdom.deployed();

  await deployer.deploy(Warrior);
  const warriorSC = await Warrior.deployed();

  await warriorSC.setup("", kingdomSC.address);
  await kingdomSC.setup(warriorSC.address);

};

