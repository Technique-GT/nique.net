//
//  PrintPublication.ts
//  
//
//  Created by Nha Han Nguyen on 7/1/26.
//

import mongoose, { Schema, Document } from 'mongoose';

// interface
export interface IPrintPublication extends Document {
  issueName: string;
  issueType: string;
  publishDate: Date;
}

// schema corresponding to the interface
const PrintPublicationSchema: Schema = new Schema({
  issueName: {
    type: String,
    required: true,
    trim: true
  },
  issueType: {
    type: String,
    required: true
  },
  publishDate: {
    type: Date,
    required: true
  }
}, { timestamps: true });

export default mongoose.model<IPrintPublication>('PrintPublication', PrintPublicationSchema);
