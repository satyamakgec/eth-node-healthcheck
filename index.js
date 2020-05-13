#!/usr/bin/env node

const Web3 = require('web3');
const http = require('http');

const host = process.env.RPC_HOST || 'localhost';
const etherscan_web3 = new Web3(new Web3.providers.HttpProvider(process.env.CONNECTION_URL));
const local_web3 = new Web3(new Web3.providers.HttpProvider(`http://${host}:8545`));
const MAX_BLOCK_DIFFERENCE = 3;

const onHealthcheckRequest = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  let localBlockNum;
  let networkBlockNum;
  let syncStatus;

  try {
    localBlockNum = await local_web3.eth.getBlockNumber();
    networkBlockNum = await etherscan_web3.eth.getBlockNumber();
    syncStatus = typeof await local_web3.eth.isSyncing() == Object ? true : false;
  } catch (e) {
    console.error(e);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(e);
  }


  let responseStatus = (networkBlockNum - localBlockNum > MAX_BLOCK_DIFFERENCE || syncStatus) ? 500 : 200;
  if (localBlockNum > 10000 && networkBlockNum <= 0) { // don't let etherscan f**k us
    responseStatus = 200;
  }
  res.writeHead(responseStatus, { 'Content-Type': 'text/plain' });
  res.end((localBlockNum - networkBlockNum).toString());
};

http.createServer(onHealthcheckRequest).listen(process.env.PORT);
