"use strict";
//
//  printPublicationController.ts
//  
//
//  Created by Nha Han Nguyen on 7/1/26.
//
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublication = exports.getPublications = void 0;
const PrintPublication_1 = __importDefault(require("../models/PrintPublication"));
// get dates
const getPublications = async (_req, res) => {
    try {
        const publications = await PrintPublication_1.default.find().sort({ publishDate: -1 });
        res.status(200).json(publications);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch publication dates.' });
    }
};
exports.getPublications = getPublications;
// enter new date
const createPublication = async (req, res) => {
    try {
        const { issueName, issueType, publishDate } = req.body;
        const newPublication = new PrintPublication_1.default({
            issueName,
            issueType,
            publishDate
        });
        await newPublication.save();
        res.status(201).json(newPublication);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create publication date.' });
    }
};
exports.createPublication = createPublication;
