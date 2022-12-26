const {expect} = require("chai");   //chai is library and mocha is a framework
const { ethers } = require("hardhat");

describe("Listing, Buying and Deleting Nft from Fixed Price Marketplace", () => {
    beforeEach( async () => {
        const BasicNft = await ethers.getContractFactory("BasicNft");
        const Marketplace = await ethers.getContractFactory("Marketplace");

        nftContract = await BasicNft.deploy();
        marketplace = await Marketplace.deploy();
        console.log("Contract Address :- "+marketplace.address);

        [account1, account2, account3] = await ethers.getSigners();

        await nftContract.connect(account1).mintNft();
        await nftContract.connect(account1).mintNft();

        //approving marketplace to spend Nfts
        await nftContract.connect(account1).approve(marketplace.address, 0);
        
    });
    it("1. Nft is successfully listed in Fixed Price Market", async () => {
        //Listing Nft
        await marketplace.connect(account1).addItem(nftContract.address,0,ethers.utils.parseEther("2"));

        //checking if Nft is listed
        const listedNft = await marketplace.getFixedListing(nftContract.address, 0);
        expect(listedNft.seller).to.equal(await nftContract.ownerOf(0));
        expect(listedNft.price).to.equal(ethers.utils.parseEther("2"));
    });
    it("2. Nft can't be listed if Nft is not approved by user - Failure", async () => {
        await expect(marketplace.connect(account1).addItem(nftContract.address,1,ethers.utils.parseEther("1"))).to.revertedWith("ERC721 : Seller is not Owner nor approved");

    });
    it("3. Can't buy a not listed Nft - Failure", async() => {
        await marketplace.connect(account1).addItem(nftContract.address,0,ethers.utils.parseEther("2"));

        //checking if Nft is listed
        const listedNft = await marketplace.getFixedListing(nftContract.address, 0);
        expect(listedNft.seller).to.equal(await nftContract.ownerOf(0));
        expect(listedNft.price).to.equal(ethers.utils.parseEther("2"));

        //buying not listed nft
        await expect(marketplace.connect(account2).buyItemAtFixed(nftContract.address, 1, {value: ethers.utils.parseEther("2")})).to.revertedWith("Item is not listed in fixed price marketplace.");
    });
    it("4. Buying of Nft", async() => {
        await marketplace.connect(account1).addItem(nftContract.address,0,ethers.utils.parseEther("2"));

        //checking if Nft is listed
        const listedNft = await marketplace.getFixedListing(nftContract.address, 0);
        expect(listedNft.seller).to.equal(await nftContract.ownerOf(0));
        expect(listedNft.price).to.equal(ethers.utils.parseEther("2"));
        prevBalance = await nftContract.balanceOf(account2.address);
        await marketplace.connect(account2).buyItemAtFixed(nftContract.address, 0,{value: ethers.utils.parseEther("2")});
        presentBalance = await nftContract.balanceOf(account2.address);
        expect(prevBalance).to.equal(0);
        expect(presentBalance).to.equal(1);
    });
    it("5. NFT can't be bought by paying a lower price - Failure", async () => {
        await marketplace.connect(account1).addItem(nftContract.address,0,ethers.utils.parseEther("2"));

        //checking if Nft is listed
        const listedNft = await marketplace.getFixedListing(nftContract.address, 0);
        expect(listedNft.seller).to.equal(await nftContract.ownerOf(0));
        expect(listedNft.price).to.equal(ethers.utils.parseEther("2"));
        await expect(marketplace.connect(account2).buyItemAtFixed(nftContract.address,0, { value: ethers.utils.parseEther("1") })).to.be.revertedWith("Must pay the correct price");
    });
    it("6. Nft can't be bought twice - Failure", async() => {
        await marketplace.connect(account1).addItem(nftContract.address,0,ethers.utils.parseEther("2"));

        //checking if Nft is listed
        const listedNft = await marketplace.getFixedListing(nftContract.address, 0);
        expect(listedNft.seller).to.equal(await nftContract.ownerOf(0));
        expect(listedNft.price).to.equal(ethers.utils.parseEther("2"));
        await marketplace.connect(account2).buyItemAtFixed(nftContract.address, 0,{value: ethers.utils.parseEther("2")});
        await expect(marketplace.connect(account2).buyItemAtFixed(nftContract.address,0,{value: ethers.utils.parseEther("2")})).to.revertedWith("Item is already Sold");
    });
    it("7. Nft Info should set to Zero after deleting", async() => {
        await marketplace.connect(account1).addItem(nftContract.address,0,ethers.utils.parseEther("2"));

        //checking if Nft is listed
        const listedNft = await marketplace.getFixedListing(nftContract.address, 0);
        expect(listedNft.seller).to.equal(await nftContract.ownerOf(0));
        expect(listedNft.price).to.equal(ethers.utils.parseEther("2"));

        //checking if Nft is deleted
        await marketplace.delListing(nftContract.address, 0);

        const delNft = await marketplace.getFixedListing(nftContract.address, 0);
        expect(delNft.seller).to.equal(ethers.constants.AddressZero);
        expect(delNft.price).to.equal(0);
    });
    it("8. Nft can't be listed twice - Failure", async() => {
        await marketplace.connect(account1).addItem(nftContract.address,0,ethers.utils.parseEther("2"));

        //checking if Nft is listed
        const listedNft = await marketplace.getFixedListing(nftContract.address, 0);
        expect(listedNft.seller).to.equal(await nftContract.ownerOf(0));
        expect(listedNft.price).to.equal(ethers.utils.parseEther("2"));

        //listing same nft again
        await expect(marketplace.connect(account1).addItem(nftContract.address,0,ethers.utils.parseEther("30"))).to.be.revertedWith("Same Nft can't be list again!");
    });
    it("9. Only owner of Nft can list in market - Failure", async() => {
        await expect(marketplace.connect(account2).addItem(nftContract.address,0,ethers.utils.parseEther("2"))).to.be.revertedWith("You are not the owner of the Nft!");
    });
});

describe("Listing Nft in an English Auction", () => {
    beforeEach( async () => {
        const BasicNft = await ethers.getContractFactory("BasicNft");
        const Marketplace = await ethers.getContractFactory("Marketplace");

        nftContract = await BasicNft.deploy();
        marketplace = await Marketplace.deploy();
        console.log("Contract Address :- "+marketplace.address);

        [account1, account2, account3] = await ethers.getSigners();

        await nftContract.connect(account1).mintNft();
        await nftContract.connect(account1).mintNft();

        //approving marketplace to spend Nfts
        await nftContract.connect(account1).approve(marketplace.address, 0);
        
    });
    it("10. Nft is successfully listed in English Auction Market", async () => {

        // let time = Math.floor(Date.now() / 1000);
        // getting timestamp
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp;
        console.log(timestampBefore);

        //Listing Nft
        await marketplace.connect(account1).addEngAuction(nftContract.address,0,ethers.utils.parseEther("1"),timestampBefore+60, timestampBefore+120);

        //checking if Nft is listed
        const listedNft = await marketplace.getEngAuctionListing(nftContract.address, 0);
        expect(listedNft.seller).to.equal(await nftContract.ownerOf(0));
        expect(listedNft.basePrice).to.equal(ethers.utils.parseEther("1"));
        expect(listedNft.startAt).to.equal(timestampBefore+60);
        expect(listedNft.endAt).to.equal(timestampBefore+120);
    });
    it("11. Same Nft can't be list again in English Auction Market", async () => {

        // let time = Math.floor(Date.now() / 1000);
        // getting timestamp
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp;
        console.log(timestampBefore);

        //Listing Nft
        await marketplace.connect(account1).addEngAuction(nftContract.address,0,ethers.utils.parseEther("1"),timestampBefore+60, timestampBefore+120);

        //checking if Nft is listed
        const listedNft = await marketplace.getEngAuctionListing(nftContract.address, 0);
        expect(listedNft.seller).to.equal(await nftContract.ownerOf(0));
        expect(listedNft.basePrice).to.equal(ethers.utils.parseEther("1"));
        expect(listedNft.startAt).to.equal(timestampBefore+60);
        expect(listedNft.endAt).to.equal(timestampBefore+120);

        //list again the same
        await expect(marketplace.connect(account1).addEngAuction(nftContract.address,0,ethers.utils.parseEther("2"),timestampBefore+60, timestampBefore+120)).to.be.revertedWith("Same Nft can't be list again!");
    });
    it("12. Nft should list only by owner in English Auction Market", async () => {

        // let time = Math.floor(Date.now() / 1000);
        // getting timestamp
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp;
        console.log(timestampBefore);

        //Listing Nft
        await expect(marketplace.connect(account2).addEngAuction(nftContract.address,0,ethers.utils.parseEther("1"),timestampBefore+60, timestampBefore+120)).to.be.revertedWith("Only list by Owner of the Nft!");
    });
    it("13. Bidding details when no one has bid", async () => {
        let time = Math.floor(Date.now() / 1000);
        //Listing Nft
        await marketplace.connect(account1).addEngAuction(nftContract.address,0,ethers.utils.parseEther("1"),time, time+120);

        //checking if Nft is listed
        const listedNft = await marketplace.getEngAuctionListing(nftContract.address, 0);
        expect(listedNft.seller).to.equal(await nftContract.ownerOf(0));
        expect(listedNft.basePrice).to.equal(ethers.utils.parseEther("1"));
        expect(listedNft.startAt).to.equal(time);
        expect(listedNft.endAt).to.equal(time+120);

        //checking highest bidder and bid
        const bid = await marketplace.getHighestBid(nftContract.address, 0);
        expect(bid.highestBidder).to.equal(ethers.constants.AddressZero);
        expect(bid.highestBid).to.equal(0);
    });
    it("14. Bid for not listed Nft in English Auction - Failure", async () => {
        let time = Math.floor(Date.now() / 1000);
        //Listing Nft
        await marketplace.connect(account1).addEngAuction(nftContract.address,0,ethers.utils.parseEther("1"),time, time+120);
        await expect(marketplace.connect(account2).bidFor(nftContract.address,1,{value: ethers.utils.parseEther("1")})).to.revertedWith("English Auction : Item is not listed.");
    });
    
});

describe("Bidding - English Auction", () => {
    beforeEach( async () => {
        //deploy contracts
        const BasicNft = await ethers.getContractFactory("BasicNft");
        const Marketplace = await ethers.getContractFactory("Marketplace");

        nftContract = await BasicNft.deploy();
        marketplace = await Marketplace.deploy();
        console.log("Contract Address :- "+marketplace.address);

        // getting timestamp
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp;
        console.log(timestampBefore);

        [account1, account2, account3] = await ethers.getSigners();

        await nftContract.connect(account1).mintNft();
        await nftContract.connect(account1).mintNft();

        //approving marketplace to spend Nfts
        await nftContract.connect(account1).approve(marketplace.address, 0);

        let time = Math.floor(Date.now() / 1000);
        //Listing Nft
        await marketplace.connect(account1).addEngAuction(nftContract.address,0,ethers.utils.parseEther("1"),time, time+120);

        //checking if Nft is listed
        const listedNft = await marketplace.getEngAuctionListing(nftContract.address, 0);
        expect(listedNft.seller).to.equal(await nftContract.ownerOf(0));
        expect(listedNft.basePrice).to.equal(ethers.utils.parseEther("1"));
        expect(listedNft.startAt).to.equal(time);
        expect(listedNft.endAt).to.equal(time+120);
    });
    describe('Place bid on an auction - success', () => {
        beforeEach(async () => {
            await marketplace.connect(account2).bidFor(nftContract.address,0,{value: ethers.utils.parseEther("3")});
        });
        it("15. Bidding Info are correctly updated", async () => {
            const bidInfo = await marketplace.getHighestBid(nftContract.address, 0);
            expect(bidInfo.highestBidder).to.equal(account2.address);
            expect(bidInfo.highestBid).to.equal(ethers.utils.parseEther("3"));
        });
        it("16. Can't Bid at price lower than highest bid - Failure", async () => {
            await expect(marketplace.connect(account3).bidFor(nftContract.address,0,{value: ethers.utils.parseEther("2")})).to.be.revertedWith("new bid price must be higher than current bid");
        });
        it("17. New Bid place and info are correctly updated", async () => {
            await marketplace.connect(account3).bidFor(nftContract.address,0,{value: ethers.utils.parseEther("4")});
            const bidInfo = await marketplace.getHighestBid(nftContract.address, 0);
            expect(bidInfo.highestBidder).to.equal(account3.address);
            expect(bidInfo.highestBid).to.equal(ethers.utils.parseEther("4"));
        });
        
    });
});

describe('Transactions - Transfer NFT and Price', () => {
    beforeEach(async () => {
        let time = Math.floor(Date.now() / 1000);
        // Deploy contract
        const BasicNft = await ethers.getContractFactory("BasicNft");
        const Marketplace = await ethers.getContractFactory("Marketplace");

        nftContract = await BasicNft.deploy();
        marketplace = await Marketplace.deploy();
        console.log("Contract Address :- "+marketplace.address);

        [account1, account2, account3] = await ethers.getSigners();

        await nftContract.connect(account1).mintNft();
        await nftContract.connect(account1).mintNft();

        //approving marketplace to spend Nfts
        await nftContract.connect(account1).approve(marketplace.address, 0);
    });
    describe('Transfer NFT and Price - Failures', () => {
        it('18. Should reject because auction is still open - Failure', async () => {
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            console.log("block.timestamp :- "+timestampBefore);

            await endAuctionSetUp(marketplace, nftContract, timestampBefore, timestampBefore+120, account1, account2);
            await expect(marketplace.connect(account1).end(nftContract.address, 0)).to.be.revertedWith('Auction is still Open');
        })
        it('19. Should reject because caller is not the seller of Nft - Failure', async () => {
            await expect(marketplace.connect(account2).end(nftContract.address, 0)).to.be.revertedWith('Nft can be settled by Seller.');
        })
    });
    describe('Transfer Nft and Price - Success', () => {
            
        it('20. Winner of the auction must be the new owner of Nft', async () => {
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            console.log("block.timestamp :- "+timestampBefore);

            await endAuctionSetUp(marketplace, nftContract, timestampBefore, timestampBefore+60, account1, account2);

            await ethers.provider.send('evm_increaseTime', [60000]);
            await ethers.provider.send('evm_mine');

            await marketplace.connect(account1).end(nftContract.address,0);
            let newOwner = await nftContract.ownerOf(0);
            expect(newOwner).to.equal(account2.address);
        })
        it('21. Seller of the Nft must have his balance credited with the highest bid amount', async () => {
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            console.log("block.timestamp :- "+timestampBefore);

            await endAuctionSetUp(marketplace, nftContract, timestampBefore, timestampBefore+60, account1, account2);

            await ethers.provider.send('evm_increaseTime', [60000]);
            await ethers.provider.send('evm_mine');

            let previousSellerBal = await account1.getBalance();
            console.log("Previous Seller Balance :- "+previousSellerBal);
            await marketplace.connect(account1).end(nftContract.address,0);
            let newOwner = await nftContract.ownerOf(0);
            expect(newOwner).to.equal(account2.address);
            let currentSellerBal = await account1.getBalance();
        })
    });
    
});


async function endAuctionSetUp(marketplace, nftContract, startTime, endTime, auctionCreator, bider) {
    //mint new NFT
    await nftContract.connect(auctionCreator).mintNft();
    // approve NFT transfer by MarketPlace contract
    await nftContract.connect(auctionCreator).approve(marketplace.address, 0)
    // create auction
    let time = Math.floor(Date.now() / 1000);
    await marketplace.connect(auctionCreator).addEngAuction(nftContract.address,0,ethers.utils.parseEther("1"),startTime, endTime);
    if (bider) {
        await marketplace.connect(bider).bidFor(nftContract.address,0,{value: ethers.utils.parseEther("2")});
    }
}

////////////////////////////////////////////////DUTCH AUCTION//////////////////////////////////////////////////////
describe("Listing Nft in Dutch Auction", () => {
    beforeEach( async () => {
        const BasicNft = await ethers.getContractFactory("BasicNft");
        const Marketplace = await ethers.getContractFactory("Marketplace");

        nftContract = await BasicNft.deploy();
        marketplace = await Marketplace.deploy();
        console.log("Contract Address :- "+marketplace.address);

        [account1, account2, account3] = await ethers.getSigners();

        await nftContract.connect(account1).mintNft();
        await nftContract.connect(account1).mintNft();

        //approving marketplace to spend Nfts
        await nftContract.connect(account1).approve(marketplace.address, 0);
        
    });
    it("22. Nft is successfully listed in Dutch Auction Market", async () => {
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp;
        console.log("block.timestamp :- "+timestampBefore);

        //Listing Nft
        await marketplace.connect(account1).addDutchAuction(nftContract.address,0,ethers.utils.parseEther("5"),ethers.utils.parseEther("2"),timestampBefore, timestampBefore+120);

        //checking if Nft is listed
        const listedNft = await marketplace.getDutchAuctionListing(nftContract.address, 0);
        expect(listedNft.startPrice).to.equal(ethers.utils.parseEther("5"));
        expect(listedNft.endPrice).to.equal(ethers.utils.parseEther("2"));
        expect(listedNft.discountRate).to.equal(BigInt((listedNft.startPrice - listedNft.endPrice)/(listedNft.endAt - listedNft.startAt)));
        expect(listedNft.seller).to.equal(await nftContract.ownerOf(0));
        expect(listedNft.startAt).to.equal(timestampBefore);
        expect(listedNft.endAt).to.equal(timestampBefore+120);
        expect(listedNft.duration).to.equal((listedNft.endAt - listedNft.startAt));
    });
    it("23. Same Nft can't be list again in Dutch Auction Marketplace - Failure", async () => {
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp;
        console.log("block.timestamp :- "+timestampBefore);

        //Listing Nft
        await marketplace.connect(account1).addDutchAuction(nftContract.address,0,ethers.utils.parseEther("5"),ethers.utils.parseEther("2"),timestampBefore, timestampBefore+120);

        //checking if Nft is listed
        const listedNft = await marketplace.getDutchAuctionListing(nftContract.address, 0);
        expect(listedNft.startPrice).to.equal(ethers.utils.parseEther("5"));
        expect(listedNft.endPrice).to.equal(ethers.utils.parseEther("2"));
        expect(listedNft.discountRate).to.equal(BigInt((listedNft.startPrice - listedNft.endPrice)/(listedNft.endAt - listedNft.startAt)));
        expect(listedNft.seller).to.equal(await nftContract.ownerOf(0));
        expect(listedNft.startAt).to.equal(timestampBefore);
        expect(listedNft.endAt).to.equal(timestampBefore+120);
        expect(listedNft.duration).to.equal((listedNft.endAt - listedNft.startAt));

        //Same Nft list again
        await expect(marketplace.connect(account1).addDutchAuction(nftContract.address,0,ethers.utils.parseEther("5"),ethers.utils.parseEther("3"),timestampBefore, timestampBefore+120)).to.be.revertedWith("Same Nft can't be list again!");
    }); 
    it("24. Nft can't be list other than owner in Dutch Auction Maretplace- Failure", async () => {
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp;
        console.log("block.timestamp :- "+timestampBefore);

        //Listing Nft
        await expect(marketplace.connect(account2).addDutchAuction(nftContract.address,0,ethers.utils.parseEther("5"),ethers.utils.parseEther("2"),timestampBefore, timestampBefore+120)).to.be.revertedWith("Nft can be list only by owner!");
    }); 
    it("25. Nft current price should decrease as per discount rate in Dutch", async() => {
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp;
        console.log("block.timestamp :- "+timestampBefore);

        //Listing Nft
        await marketplace.connect(account1).addDutchAuction(nftContract.address,0,ethers.utils.parseEther("5"),ethers.utils.parseEther("2"),timestampBefore, timestampBefore+180);

        await ethers.provider.send('evm_increaseTime', [60000]);
        await ethers.provider.send('evm_mine');

        //checking if Nft is listed
        const listedNft = await marketplace.getDutchAuctionListing(nftContract.address, 0);

        //getting current price of nft to buy
        let currentPrice = await marketplace.connect(account2).dutchPrice(nftContract.address,0);
        
        expect(BigInt(currentPrice)).not.to.be.equal(BigInt(listedNft.startPrice));
    });
    it("26. Buy Nft at current price from Dutch Auction Marketplace", async() => {
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp;
        console.log("block.timestamp :- "+timestampBefore);

        //Listing Nft
        await marketplace.connect(account1).addDutchAuction(nftContract.address,0,ethers.utils.parseEther("5"),ethers.utils.parseEther("2"),timestampBefore, timestampBefore+180);

        await ethers.provider.send('evm_increaseTime', [60000]);
        await ethers.provider.send('evm_mine');

        //getting current price of nft to buy
        let currentPrice = await marketplace.connect(account2).dutchPrice(nftContract.address,0);
        
        //buy Nft
        await marketplace.connect(account2).buyFromDutch(nftContract.address,0,{value: ethers.utils.parseEther(BigInt(currentPrice))});
        let newOwner = await nftContract.ownerOf(0);
        expect(newOwner).to.equal(account2.address);
    });
});