const { LibraWallet, LibraClient, LibraNetwork, LibraAdmissionControlStatus } = require("kulap-libra");
const BigNumber = require('bignumber.js')
const axios = require('axios')

const client = new LibraClient({network: LibraNetwork.Testnet});

// create wallet
const createWallet = async() => {
    const wallet = new LibraWallet()
    const account = wallet.newAccount()

    return {
        account: account,
        address: account.getAddress().toHex(),
        mnemonic: wallet.config.mnemonic
    }
}

// query balance
const getBalance = async(address) => {
    const accountState = await client.getAccountState(address)
    const balanceWithMicro = accountState.balance.toString()
    const balance = BigNumber(balanceWithMicro).div(1e6).toString()
    return {
        balance: balance,
        balanceWithMicro: balanceWithMicro
    }
}

// mint
const mint = async(address, amount) => {
    const newAmount = BigNumber(amount).times(1e6)
    return await client.mintWithFaucetService(address, newAmount)
}

// transfer
const transfer = async(account, recipient, amount) => {
    const newAmount = BigNumber(amount).times(1e6)
    const response = await client.transferCoins(account, recipient, newAmount)
    if(response.getAcStatus().getCode() !== LibraAdmissionControlStatus.ACCEPTED) {
        throw new Error(`admission_control failed with status ${LibraAdmissionControlStatus[response.acStatus]}`)
    }
    return response
}

// get transaction (extra)
const getTransactions = async(address) => {
    const response = await axios.get('https://api-test.libexplorer.com/api?module=account&action=txlist&address=' + address)
    return response.data
}

(async () => {
    // do something here
    console.log('hello hacktoberfest')
    // create wallet
    const wallet = await createWallet()
    console.log('mnemonic: ' + wallet.mnemonic)
    console.log('address: ' + wallet.address)
    // get initial balance
    const initial_balance = await getBalance(wallet.address)
    console.log('initial balance: ' + initial_balance.balance)
    // mint some coin
    await mint(wallet.address, 1000)
    const minted_balance = await getBalance(wallet.address)
    console.log('mint balance: ' + minted_balance.balance)
    // transfer
    const wallet2 = await createWallet()
    console.log('recipient address: ' + wallet2.address)
    const recipient_initial_balance = await getBalance(wallet2.address)
    console.log('recipient initial balance: ' + recipient_initial_balance.balance)
    await transfer(wallet.account, wallet2.address, 100)
    console.log('transfer 100 Lib')
    const final_balance = await getBalance(wallet.address)
    console.log('final balance: ' + final_balance.balance)
    const recipient_final_balance = await getBalance(wallet2.address)
    console.log('recipient final balnace: ' + recipient_final_balance.balance)
    // get transaction history
    console.log('get transactions !!!')
    const transactions = await getTransactions(wallet.address)
    console.log(transactions)
})()

