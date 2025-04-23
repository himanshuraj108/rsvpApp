import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

// This constant defines the path where uploaded files will be stored
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Helper function to ensure upload directory exists
async function ensureUploadDirExists() {
  try {
    // Check if the directory exists
    try {
      const stats = await stat(UPLOADS_DIR);
      if (!stats.isDirectory()) {
        throw new Error('Uploads path exists but is not a directory');
      }
    } catch (error) {
      // Directory doesn't exist or other error, try to create it
      console.log('Creating uploads directory:', UPLOADS_DIR);
      await mkdir(UPLOADS_DIR, { recursive: true });
    }
    
    // Double-check the directory was created successfully
    const stats = await stat(UPLOADS_DIR);
    if (!stats.isDirectory()) {
      throw new Error('Failed to create uploads directory');
    }
    
    console.log('Uploads directory ready:', UPLOADS_DIR);
    return true;
  } catch (error) {
    console.error('Error with uploads directory:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data with file
    const formData = await request.formData();
    const file = formData.get('file');
    const chatId = formData.get('chatId');

    if (!file || !chatId) {
      return NextResponse.json(
        { error: 'File and chatId are required' },
        { status: 400 }
      );
    }

    // Check if file has a valid type
    // This is a basic check - you may want to add more validation for security
    const validFileTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg'
    ];

    const validExtensions = ['pdf', 'jpg', 'jpeg'];

    // Get file type and name
    const fileType = file.type;
    let originalName = file.name;
    
    // Get the file extension for additional validation
    const fileExtension = originalName.split('.').pop().toLowerCase();
    
    // Simple security check - don't allow potentially harmful files
    if (!validFileTypes.includes(fileType) || !validExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, and JPEG files are allowed.' },
        { status: 400 }
      );
    }

    // Create a unique filename to prevent collisions
    // Get the file extension
    const uniqueId = uuidv4();
    const fileName = `${uniqueId}-${Date.now()}.${fileExtension}`;
    
    // Ensure the upload directory exists
    await ensureUploadDirExists();
    
    // Create the full path for the file
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    // Convert the file to an ArrayBuffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Write the file
    await writeFile(filePath, buffer);
    
    // Generate the URL for the uploaded file
    // This assumes your app is serving /public/uploads via Next.js static file serving
    const fileUrl = `/uploads/${fileName}`;
    
    return NextResponse.json({
      success: true,
      fileUrl,
      originalName,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file: ' + error.message },
      { status: 500 }
    );
  }
}

// Configure the API route to handle large files
export const config = {
  api: {
    bodyParser: false,
  },
}; 