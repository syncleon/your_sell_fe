import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeDialog.css';
import { Item } from "../models/IItem";
import { API_ENDPOINTS } from "../apiService";
import { RouteNames } from "../routes";

interface AuctionItem {
    item: Item;
    endTime: number;
    auctionStatus: 'STARTED' | 'CLOSED';
}

const HomeDialog: React.FC = () => {
    const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([]);
    const [featuredImages, setFeaturedImages] = useState<{ [key: string]: string }>({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAuctionItems = async () => {
            try {
                const response = await fetch(API_ENDPOINTS.AUCTIONS);
                const auctions: AuctionItem[] = await response.json();

                setAuctionItems(auctions);

                await Promise.all(
                    auctions.map(async ({ item }) => {
                        const filenameResponse = await fetch(`${API_ENDPOINTS.ITEMS}/${item.id}/images/featured`);
                        if (filenameResponse.ok) {
                            const filenames: string[] = await filenameResponse.json();
                            if (filenames.length > 0) {
                                setFeaturedImages(prev => ({ ...prev, [item.id]: filenames[0] }));
                            }
                        }
                    })
                );
            } catch (error) {
                console.error('Error fetching auction items:', error);
            }
        };

        fetchAuctionItems();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setAuctionItems(prevItems => {
                return prevItems.map(auction => {
                    if (auction.auctionStatus === 'STARTED' && auction.endTime <= Date.now()) {
                        return { ...auction, auctionStatus: 'CLOSED' };
                    }
                    return auction;
                });
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const calculateTimeLeft = (endTime: number): string => {
        const difference = endTime - Date.now();
        if (difference <= 0) return 'Ended';

        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        return `${hours}h ${minutes}m ${seconds}s`;
    };

    const handleImageClick = (itemId: string) => {
        navigate(RouteNames.ITEM_DETAILS.replace(':id', itemId));
    };

    const getFeaturedImageUrl = (itemId: string, filename: string): string => {
        return `${API_ENDPOINTS.ITEMS}/${itemId}/images/featured/${filename}`;
    };

    const currentAuctions = auctionItems.filter(auction => auction.auctionStatus === 'STARTED');
    const pastAuctions = auctionItems.filter(auction => auction.auctionStatus === 'CLOSED');

    return (
        <div className="home-dialog">
            {/* Current Auctions Section */}
            <div className="auction-section">
                <h2>Active listing</h2>
                <div className="grid-container">
                    {currentAuctions.map(({ item, endTime }) => (
                        <div key={item.id} className="auction-item">
                            <div className="image-wrapper" onClick={() => handleImageClick(item.id)}>
                                <img
                                    src={featuredImages[item.id] ? getFeaturedImageUrl(item.id, featuredImages[item.id]) : ''}
                                    alt={`${item.year} ${item.make} ${item.model}`}
                                />
                                <div className={`badge active`}>{calculateTimeLeft(endTime)}</div>
                            </div>
                            <h3>{item.year} {item.make} {item.model}</h3>
                            <p>
                                {item.mileage} km,&nbsp;
                                {item.isSold ? 'Sold' : 'Available'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Past Auctions Section */}
            <div className="past-auction-section">
                <h2>Past Results</h2>
                <div className="grid-container">
                    {pastAuctions.map(({ item }) => (
                        <div key={item.id} className="auction-item">
                            <div className="image-wrapper" onClick={() => handleImageClick(item.id)}>
                                <img
                                    src={featuredImages[item.id] ? getFeaturedImageUrl(item.id, featuredImages[item.id]) : ''}
                                    alt={`${item.year} ${item.make} ${item.model}`}
                                />
                                <div className={`badge ended`}>Ended</div>
                            </div>
                            <h3>{item.year} {item.make} {item.model}</h3>
                            <p>
                                {item.mileage} km,&nbsp;
                                {item.isSold ? 'Sold' : 'Available'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomeDialog;
