
const Tether = artifacts.require('Tether');
const RWD = artifacts.require('RWD');
const DecentralBank = artifacts.require('DecentralBank');

require('chai')
.use(require('chai-as-promised'))
.should()

contract('DecentralBank', ([owner, customer]) => {
    let tether, rwd, decentralBank

    function tokens(number) {
        return web3.utils.toWei(number, 'ether')
    }

    before(async() => {
        //Load contracts
        tether = await Tether.new()
        rwd = await RWD.new()
        decentralBank = await DecentralBank.new(rwd.address, tether.address)

        // Transfer all tokens to DecentralBank (1 million)
        await rwd.transfer(decentralBank.address, tokens('1000000'))

        // Transfer 100 mock tether tokens to customer
        await tether.transfer(customer, tokens('100'), {from: owner})
        
        
    })
    
    
    describe('Mock Tether Deployement', async () => {
        it('matches name successfully', async () => {
            const name = await tether.name()
            assert.equal(name, 'Mock Tether Token')
        })
    })

    describe('Reward Token Deployement', async () => {
        it('matches name successfully', async () => {
            const name = await rwd.name()
            assert.equal(name, 'Reward Token')
        })
    })
    describe('Decentral Bank Deployement', async () => {
        it('matches name successfully', async () => {
            const name = await decentralBank.name()
            assert.equal(name, 'Decentral Bank')
        })

        it('contract has tokens', async () => {
            let balance = await rwd.balanceOf(decentralBank.address)
            assert.equal(balance, tokens('1000000'))
        })
        

        describe('Yield Farming', async () => {
            it('rewards tokens for staking', async () => {
                let result

                //Check Investor Balance
                result = await tether.balanceOf(customer)
                assert.equal(result.toString(), tokens('100'), 'Customer mock wallet balance before staking')

                //Check staking for customers of 100 tokens
                await tether.approve(decentralBank.address, tokens('100'), {from: customer})
                await decentralBank.depositTokens(tokens('100'), {from: customer})
                
                // check updated balance of customer
                result = await tether.balanceOf(customer)
                assert.equal(result.toString(), tokens('0'), 'Customer mock wallet balance after staking from customer')
                
                // check updated balance of Decentral Bank
                result = await tether.balanceOf(decentralBank.address)
                assert.equal(result.toString(), tokens('100'), 'Decentral Bank mock wallet balance after staking from customer')
            
                //Is staking balance 
                result = await decentralBank.isStaking(customer)
                assert.equal(result.toString(), 'true', 'Customer is staking status after staking from customer')
                
                // Issue tokens
                await decentralBank.issueTokens({from: owner})

                //Ensure only the owner can issue tokens
                //await decentralBank.issueTokens({from: customer}).should.be.rejected;

                // Unstake Tokens
                await decentralBank.unstakeTokens({from: customer})

                // Check Unstaking Balances

                result = await tether.balanceOf(customer)
                assert.equal(result.toString(), tokens('100'), 'Customer mock wallet balance after unstaking')
                
                // check updated balance of Decentral Bank
                result = await tether.balanceOf(decentralBank.address)
                assert.equal(result.toString(), tokens('0'), 'Decentral Bank mock wallet balance after unstaking')
            
                //Is staking balance 
                result = await decentralBank.isStaking(customer)
                assert.equal(result.toString(), 'false', 'Customer is staking status after staking from customer')

            })
        })
    })   
})