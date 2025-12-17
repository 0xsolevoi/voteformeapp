import hre from 'hardhat'
const { ethers } = hre

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('Deploying SecretVoting...')
  console.log('Deployer:', deployer.address)

  const SecretVoting = await ethers.getContractFactory('SecretVoting')
  const voting = await SecretVoting.deploy()
  await voting.waitForDeployment()

  const address = await voting.getAddress()
  console.log('Deployed to:', address)

  // test poll creation
  const tx = await voting.createPoll(
    'What is your favorite color?',
    ['Red', 'Blue', 'Green'],
    3600
  )
  const receipt = await tx.wait()
  
  const event = receipt?.logs.find((log: any) => {
    try {
      const parsed = voting.interface.parseLog(log)
      return parsed?.name === 'PollCreated'
    } catch {
      return false
    }
  })

  if (event) {
    const parsed = voting.interface.parseLog(event)
    const pollId = parsed?.args.pollId
    console.log('Test poll created:', pollId.toString())
  }

  console.log('Done!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

