//
//  printPublicationController.ts
//  
//
//  Created by Nha Han Nguyen on 7/1/26.
//

import { Request, Response } from 'express';
import PrintPublication, { IPrintPublication } from '../models/PrintPublication';

// get dates
export const getPublications = async (req: Request, res: Response): Promise<void> => {
  try {
    const publications: IPrintPublication[] = await PrintPublication.find().sort({ publishDate: -1 });
    res.status(200).json(publications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch publication dates.' });
  }
};

// enter new date
export const createPublication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { issueName, issueType, publishDate } = req.body;
    const newPublication: IPrintPublication = new PrintPublication({
      issueName,
      issueType,
      publishDate
    });
    
    await newPublication.save();
    res.status(201).json(newPublication);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create publication date.' });
  }
};
