# Multiple Images Support for Received Purchases

## Overview
This update adds support for multiple images in the received purchases system. Instead of storing single image filenames, the system now stores multiple images in CSV format with numbered names (1, 2, 3, etc.).

## Changes Made

### 1. Database Schema Updates
- Changed `vehicle_image` field to `vehicle_images` (TEXT type)
- Changed `delivery_slip_image` field to `delivery_slip_images` (TEXT type)
- Both fields now support multiple images stored in CSV format

### 2. File Upload Configuration
- Updated upload utility to allow up to 10 images per field
- Modified routes to handle multiple file uploads

### 3. Controller Updates
- Modified `createReceivedPurchase` to process multiple images
- Modified `updateReceivedPurchase` to handle multiple images
- Added helper function `parseImageCSV` to convert CSV back to array format
- Updated all GET methods to return parsed image arrays

## Image Storage Format

### CSV Format
Images are stored in the database using this CSV format:
```
1,filename1.jpg;2,filename2.jpg;3,filename3.jpg
```

### Parsed Output
When retrieving data, images are returned as an array of objects:
```json
{
  "vehicle_images": [
    {"number": 1, "filename": "filename1.jpg"},
    {"number": 2, "filename": "filename2.jpg"},
    {"number": 3, "filename": "filename3.jpg"}
  ],
  "delivery_slip_images": [
    {"number": 1, "filename": "filename2.jpg"},
    {"number": 2, "filename": "filename3.jpg"}
  ]
}
```

## API Usage

### Creating Received Purchase with Multiple Images
```javascript
// Frontend form data with multiple files
const formData = new FormData();
formData.append('vehicle_image', file1);
formData.append('vehicle_image', file2);
formData.append('vehicle_image', file3);
formData.append('delivery_slip_image', slip1);
formData.append('delivery_slip_image', slip2);
// ... other fields
```

### Updating Received Purchase
- If new images are uploaded, they replace the existing ones
- If no new images are uploaded, existing images are preserved
- Images are automatically numbered starting from 1

## Database Migration

### Option 1: Run SQL Script
Execute the migration script:
```bash
mysql -u username -p database_name < scripts/migrate_received_purchases_images.sql
```

### Option 2: Manual Migration
1. Add new columns: `vehicle_images_new`, `delivery_slip_images_new`
2. Copy existing data
3. Drop old columns
4. Rename new columns

## Benefits

1. **Multiple Images**: Support for multiple vehicle and delivery slip images
2. **Numbered Naming**: Automatic numbering (1, 2, 3, etc.) for easy identification
3. **Backward Compatibility**: Existing single images are preserved during migration
4. **Flexible Storage**: TEXT field allows for unlimited image storage
5. **Easy Parsing**: Simple CSV format for database storage, JSON array for API responses

## File Limits

- **Maximum images per field**: 10
- **Supported formats**: All image formats supported by multer
- **Storage location**: `/uploads/received_purchases/` directory

## Error Handling

- If no images are uploaded, fields are set to `null`
- If images fail to upload, the entire request fails (transaction rollback)
- Invalid file types are rejected by multer middleware

## Testing

Test the new functionality by:
1. Creating a received purchase with multiple images
2. Updating an existing received purchase with new images
3. Retrieving received purchases to verify image parsing
4. Checking that existing data is preserved after migration
