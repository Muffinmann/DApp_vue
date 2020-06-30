const aptsc = artifacts.require("APTSC");

contract("Gas Test", async accounts =>{

  it("create test", async() => {
    let APTSC = await aptsc.deployed();
    let firstToken = await APTSC.create(20, "", "aaaaaaaaaa", accounts[1], {from: accounts[1]});
    console.log("Gas used for first token: " + firstToken.receipt.gasUsed);
    let uri0 = await APTSC.create(20, "", "aaaaaaaaaa", accounts[1], {from: accounts[1]});
    console.log("Gas used for token with 0 char Uri: " + uri0.receipt.gasUsed);
    let uri2 = await APTSC.create(20, "aa", "aaaaaaaaaa", accounts[1], {from: accounts[1]});
    console.log("Gas used for token with 2 char Uri: " + uri2.receipt.gasUsed);
    let uri4 = await APTSC.create(20, "aaaa", "aaaaaaaaaa", accounts[1], {from: accounts[1]});
    console.log("Gas used for token with 4 char Uri: " + uri4.receipt.gasUsed);
    let uri6 = await APTSC.create(20, "aaaaaa", "aaaaaaaaaa", accounts[1], {from: accounts[1]});
    console.log("Gas used for token with 6 char Uri: " + uri6.receipt.gasUsed);
    let uri8 = await APTSC.create(20, "aaaaaaaa", "aaaaaaaaaa", accounts[1], {from: accounts[1]});
    console.log("Gas used for token with 8 char Uri: " + uri8.receipt.gasUsed);
    let uri10 = await APTSC.create(20, "aaaaaaaaaa", "aaaaaaaaaa", accounts[1], {from: accounts[1]});
    console.log("Gas used for token with 10 char Uri: " + uri10.receipt.gasUsed);
    let uri12 = await APTSC.create(20, "aaaaaaaaaaaa", "aaaaaaaaaa", accounts[1], {from: accounts[1]});
    console.log("Gas used for token with 12 char Uri: " + uri12.receipt.gasUsed);
    let uri14 = await APTSC.create(20, "aaaaaaaaaaaaaa", "aaaaaaaaaa", accounts[1], {from: accounts[1]});
    console.log("Gas used for token with 14 char Uri: " + uri14.receipt.gasUsed);
    let uri16 = await APTSC.create(20, "aaaaaaaaaaaaaaaa", "aaaaaaaaaa", accounts[1], {from: accounts[1]});
    console.log("Gas used for token with 16 char Uri: " + uri16.receipt.gasUsed);
    let uri18 = await APTSC.create(20, "aaaaaaaaaaaaaaaaaa", "aaaaaaaaaa", accounts[1], {from: accounts[1]});
    console.log("Gas used for token with 18 char Uri: " + uri18.receipt.gasUsed);
    let uri20 = await APTSC.create(20, "aaaaaaaaaaaaaaaaaaaa", "aaaaaaaaaa", accounts[1], {from: accounts[1]});
    console.log("Gas used for token with 20 char Uri: " + uri20.receipt.gasUsed);

    let nonce = await APTSC.nonce();
    assert(nonce == 12);
  });

  it("transfer test", async() => {
    let APTSC = await aptsc.deployed();
    let transfer1 = await APTSC.safeBatchTransferFrom(accounts[1], accounts[2], [1], [1], "0x46", {from: accounts[1]});
    console.log("Gas used for transfering 1 token: " + transfer1.receipt.gasUsed);
    let transfer2 = await APTSC.safeBatchTransferFrom(accounts[1], accounts[2], [1,2], [1,1], "0x46", {from: accounts[1]});
    console.log("Gas used for transfering 2 token: " + transfer2.receipt.gasUsed);
    let transfer3 = await APTSC.safeBatchTransferFrom(accounts[1], accounts[2], [1,2,3], [1,1,1], "0x46", {from: accounts[1]});
    console.log("Gas used for transfering 3 token: " + transfer3.receipt.gasUsed);
    let transfer4 = await APTSC.safeBatchTransferFrom(accounts[1], accounts[2], [1,2,3,4], [1,1,1,1], "0x46", {from: accounts[1]});
    console.log("Gas used for transfering 4 token: " + transfer4.receipt.gasUsed);
    let transfer5 = await APTSC.safeBatchTransferFrom(accounts[1], accounts[2], [1,2,3,4,5], [1,1,1,1,1], "0x46", {from: accounts[1]});
    console.log("Gas used for transfering 5 token: " + transfer5.receipt.gasUsed);
    let transfer6 = await APTSC.safeBatchTransferFrom(accounts[1], accounts[2], [1,2,3,4,5,6], [1,1,1,1,1,1], "0x46", {from: accounts[1]});
    console.log("Gas used for transfering 6 token: " + transfer6.receipt.gasUsed);
    let transfer7 = await APTSC.safeBatchTransferFrom(accounts[1], accounts[2], [1,2,3,4,5,6,7], [1,1,1,1,1,1,1], "0x46", {from: accounts[1]});
    console.log("Gas used for transfering 7 token: " + transfer7.receipt.gasUsed);
    let transfer8 = await APTSC.safeBatchTransferFrom(accounts[1], accounts[2], [1,2,3,4,5,6,7,8], [1,1,1,1,1,1,1,1], "0x46", {from: accounts[1]});
    console.log("Gas used for transfering 8 token: " + transfer8.receipt.gasUsed);
    let transfer9 = await APTSC.safeBatchTransferFrom(accounts[1], accounts[2], [1,2,3,4,5,6,7,8,9], [1,1,1,1,1,1,1,1,1], "0x46", {from: accounts[1]});
    console.log("Gas used for transfering 9 token: " + transfer9.receipt.gasUsed);
    let transfer10 = await APTSC.safeBatchTransferFrom(accounts[1], accounts[2], [1,2,3,4,5,6,7,8,9,10], [1,1,1,1,1,1,1,1,1,1], "0x46", {from: accounts[1]});
    console.log("Gas used for transfering 10 token: " + transfer10.receipt.gasUsed);

    let balanceAcc2Token1 = await APTSC.balanceOf(accounts[2], 1);
    assert(balanceAcc2Token1 == 10);
  });

  it("creates more tokens for crafting test", async() => {
    let APTSC = await aptsc.deployed();
    for (let i = 0; i<50; i++){
      await APTSC.create(20, "for crafting", "someSerialNumber", accounts[3], {from: accounts[3]});
    }

    let nonce = await APTSC.nonce();
    assert(nonce == 62);
  });

  it("craft test", async() => {
    let APTSC = await aptsc.deployed();

    let craft1 =await APTSC.craft([13], [1], 1, "aaaaaaaaaa", accounts[3], "aaaaaaaaaa", {from: accounts[3]});
    console.log("Gas used for crafting new token from 1 input: "+ craft1.receipt.gasUsed);
    let craft2 =await APTSC.craft([13,14], [1,1], 1, "aaaaaaaaaa", accounts[3], "aaaaaaaaaa", {from: accounts[3]});
    console.log("Gas used for crafting new token from 2 inputs: "+ craft2.receipt.gasUsed);
    let craft3 =await APTSC.craft([13,14,15], [1,1,1], 1, "aaaaaaaaaa", accounts[3], "aaaaaaaaaa", {from: accounts[3]});
    console.log("Gas used for crafting new token from 3 inputs: "+ craft3.receipt.gasUsed);
    let craft4 =await APTSC.craft([13,14,15,16], [1,1,1,1], 1, "aaaaaaaaaa", accounts[3], "aaaaaaaaaa", {from: accounts[3]});
    console.log("Gas used for crafting new token from 4 inputs: "+ craft4.receipt.gasUsed);
    let craft5 =await APTSC.craft([13,14,15,16,17], [1,1,1,1,1], 1, "aaaaaaaaaa", accounts[3], "aaaaaaaaaa", {from: accounts[3]});
    console.log("Gas used for crafting new token from 5 inputs: "+ craft5.receipt.gasUsed);
    let craft6 =await APTSC.craft([13,14,15,16,17,18], [1,1,1,1,1,1], 1, "aaaaaaaaaa", accounts[3], "aaaaaaaaaa", {from: accounts[3]});
    console.log("Gas used for crafting new token from 6 inputs: "+ craft6.receipt.gasUsed);
    let craft7 =await APTSC.craft([13,14,15,16,17,18,19], [1,1,1,1,1,1,1], 1, "aaaaaaaaaa", accounts[3], "aaaaaaaaaa", {from: accounts[3]});
    console.log("Gas used for crafting new token from 7 inputs: "+ craft7.receipt.gasUsed);
    let craft8 =await APTSC.craft([13,14,15,16,17,18,19,20], [1,1,1,1,1,1,1,1], 1, "aaaaaaaaaa", accounts[3], "aaaaaaaaaa", {from: accounts[3]});
    console.log("Gas used for crafting new token from 8 inputs: "+ craft8.receipt.gasUsed);
    let craft9 =await APTSC.craft([13,14,15,16,17,18,19,20,21], [1,1,1,1,1,1,1,1,1], 1, "aaaaaaaaaa", accounts[3], "aaaaaaaaaa", {from: accounts[3]});
    console.log("Gas used for crafting new token from 9 inputs: "+ craft9.receipt.gasUsed);
    let craft10 =await APTSC.craft([13,14,15,16,17,18,19,20,21,22], [1,1,1,1,1,1,1,1,1,1], 1, "aaaaaaaaaa", accounts[3], "aaaaaaaaaa", {from: accounts[3]});
    console.log("Gas used for crafting new token from 10 inputs: "+ craft10.receipt.gasUsed);

    let state0 = await APTSC.newStatus(66, "", accounts[3], {from: accounts[3]});
    console.log("state 0: "+ state0.receipt.gasUsed);
    let state2 = await APTSC.newStatus(66, "aa", accounts[3], {from: accounts[3]});
    console.log("state 2: "+ state2.receipt.gasUsed);
    let state4 = await APTSC.newStatus(66, "aaaa", accounts[3], {from: accounts[3]});
    console.log("state 4: "+ state4.receipt.gasUsed);
    let state6 = await APTSC.newStatus(66, "aaaaaa", accounts[3], {from: accounts[3]});
    console.log("state 6: "+ state6.receipt.gasUsed);
    let state8 = await APTSC.newStatus(66, "aaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("state 8: "+ state8.receipt.gasUsed);
    let state10 = await APTSC.newStatus(66, "aaaaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("state 10: "+ state10.receipt.gasUsed);
    let state12 = await APTSC.newStatus(66, "aaaaaaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("state 12: "+ state12.receipt.gasUsed);
    let state14 = await APTSC.newStatus(66, "aaaaaaaaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("state 14: "+ state14.receipt.gasUsed);
    let state16 = await APTSC.newStatus(66, "aaaaaaaaaaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("state 16: "+ state16.receipt.gasUsed);
    let state18 = await APTSC.newStatus(66, "aaaaaaaaaaaaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("state 18: "+ state18.receipt.gasUsed);
    let state20 = await APTSC.newStatus(66, "aaaaaaaaaaaaaaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("state 20: "+ state20.receipt.gasUsed);

    let metaUpdate0 = await APTSC.updateMetadata(66,"","","", accounts[3], {from: accounts[3]});
    console.log("updateMetadata 0: "+ metaUpdate0.receipt.gasUsed);
    let metaUpdate2 = await APTSC.updateMetadata(66, "aa","aa","aa", accounts[3], {from: accounts[3]});
    console.log("updateMetadata 2: "+ metaUpdate2.receipt.gasUsed);
    let metaUpdate4 = await APTSC.updateMetadata(66, "aaaa","aaaa","aaaa", accounts[3], {from: accounts[3]});
    console.log("updateMetadata 4: "+ metaUpdate4.receipt.gasUsed);
    let metaUpdate6 = await APTSC.updateMetadata(66, "aaaaaa","aaaaaa","aaaaaa", accounts[3], {from: accounts[3]});
    console.log("updateMetadata 6: "+ metaUpdate6.receipt.gasUsed);
    let metaUpdate8 = await APTSC.updateMetadata(66, "aaaaaaaa","aaaaaaaa","aaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("updateMetadata 8: "+ metaUpdate8.receipt.gasUsed);
    let metaUpdate10 = await APTSC.updateMetadata(66, "aaaaaaaaaa","aaaaaaaaaa","aaaaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("updateMetadata 10: "+ metaUpdate10.receipt.gasUsed);
    let metaUpdate12 = await APTSC.updateMetadata(66, "aaaaaaaaaaaa","aaaaaaaaaaaa","aaaaaaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("updateMetadata 12: "+ metaUpdate12.receipt.gasUsed);
    let metaUpdate14 = await APTSC.updateMetadata(66, "aaaaaaaaaaaaaa","aaaaaaaaaaaaaa","aaaaaaaaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("updateMetadata 14: "+ metaUpdate14.receipt.gasUsed);
    let metaUpdate16 = await APTSC.updateMetadata(66, "aaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("updateMetadata 16: "+ metaUpdate16.receipt.gasUsed);
    let metaUpdate18 = await APTSC.updateMetadata(66, "aaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("updateMetadata 18: "+ metaUpdate18.receipt.gasUsed);
    let metaUpdate20 = await APTSC.updateMetadata(66, "aaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaa", accounts[3], {from: accounts[3]});
    console.log("updateMetadata 20: "+ metaUpdate20.receipt.gasUsed);


    let addController = await APTSC.addController(66,accounts[4], {from: accounts[3]});
    console.log("addController: "+ addController.receipt.gasUsed);
    let renounceControl = await APTSC.renounceControl(66, {from: accounts[3]});
    console.log("renounceControl: "+ renounceControl.receipt.gasUsed);
    let transferControl = await APTSC.transferControl(66,accounts[3], {from: accounts[4]});
    console.log("transferControl: "+ transferControl.receipt.gasUsed);
    let safeTransferFrom = await APTSC.safeTransferFrom(accounts[3],accounts[4],67,1,"0x42",{from:accounts[3]});
    console.log("safeTransferFrom: " + safeTransferFrom.receipt.gasUsed);

  });
/*
  it("combined production test", async() => {
    let APTSC = await aptsc.deployed();
    await APTSC.create(20, "Uri as link", "Serial Number", {from: accounts[4]});
    await APTSC.create(20, "Uri as link", "Serial Number", {from: accounts[4]});
    await APTSC.create(20, "Uri as link", "Serial Number", {from: accounts[4]});
    await APTSC.create(20, "Uri as link", "Serial Number", {from: accounts[4]});
    await APTSC.craft([64],[1],5,"Uri as link", accounts[4],"Serial Number", {from: accounts[4]});
    await APTSC.craft([63,64],[1,1],5,"Uri as link", accounts[4],"Serial Number", {from: accounts[4]});
    await APTSC.craft([63,64,65],[1,1,1],5,"Uri as link", accounts[4],"Serial Number", {from: accounts[4]});
    await APTSC.craft([63,64,65,66,67,68],[1,1,1,1,1,1],5,"Uri as link", accounts[4],"Serial Number", {from: accounts[4]});
    await APTSC.safeBatchTransferFrom(accounts[4],accounts[5],[69,70],[5,5],"0x46", {from: accounts[4]});
    await APTSC.transferControl(70,accounts[5],{from: accounts[4]});
    await APTSC.newStatus(70, "tested and accepted", {from: accounts[5]});
  });

  it("combined production test gas analysis for cumulative plot", async() => {
    let APTSC = await aptsc.deployed();
    let one = await APTSC.create(20, "Uri as link", "Serial Number", {from: accounts[4]});
    console.log("Gas used for creation 1: "+ one.receipt.gasUsed);
    let two = await APTSC.create(20, "Uri as link", "Serial Number", {from: accounts[4]});
    console.log("Gas used for creation 2: "+ two.receipt.gasUsed);
    let three = await APTSC.create(20, "Uri as link", "Serial Number", {from: accounts[4]});
    console.log("Gas used for creation 3: "+ three.receipt.gasUsed);
    let four = await APTSC.create(20, "Uri as link", "Serial Number", {from: accounts[4]});
    console.log("Gas used for creation 4: "+ four.receipt.gasUsed);
    let five = await APTSC.craft([64],[1],5,"Uri as link", accounts[4],"Serial Number", {from: accounts[4]});
    console.log("Gas used for craft 1: "+ five.receipt.gasUsed);
    let six = await APTSC.craft([64,65],[1,1],5,"Uri as link", accounts[4],"Serial Number", {from: accounts[4]});
    console.log("Gas used for craft 2: "+ six.receipt.gasUsed);
    let seven = await APTSC.craft([64,65,66],[1,1,1],5,"Uri as link", accounts[4],"Serial Number", {from: accounts[4]});
    console.log("Gas used for craft 3: "+ seven.receipt.gasUsed);
    let eight = await APTSC.craft([64,65,66,67,68],[1,1,1,1,1],5,"Uri as link", accounts[4],"Serial Number", {from: accounts[4]});
    console.log("Gas used for craft 4: "+ eight.receipt.gasUsed);
    let nine = await APTSC.safeBatchTransferFrom(accounts[4],accounts[5],[69,70],[5,5],"0x46", {from: accounts[4]});
    console.log("Gas used for token transfer: "+ nine.receipt.gasUsed);
    let ten = await APTSC.transferControl(70,accounts[5],{from: accounts[4]});
    console.log("Gas used for control transfer: "+ ten.receipt.gasUsed);
    let eleven = await APTSC.newStatus(70, "tested and accepted", {from: accounts[5]});
    console.log("Gas used for status update: "+ eleven.receipt.gasUsed);
  });
*/
});
