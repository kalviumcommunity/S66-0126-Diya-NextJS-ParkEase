# S3 Configuration Guide for Profile Picture Uploads

This guide explains how to set up AWS S3 for the ParkEase profile picture upload feature.

## Prerequisites

- AWS Account with IAM user credentials
- `aws-cli` installed and configured (optional, for manual setup)

## Environment Variables

Add these to your `.env.local` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=parkease-uploads
```

## S3 Bucket Setup

### 1. Create the Bucket

```bash
aws s3api create-bucket \
  --bucket parkease-uploads \
  --region us-east-1
```

Note: Bucket names must be globally unique. Replace `parkease-uploads` with a unique name.

### 2. Enable CORS

Create a file `cors-config.json`:

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://parkease.example.com"
      ],
      "ExposeHeaders": ["ETag", "x-amz-version-id"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply CORS configuration:

```bash
aws s3api put-bucket-cors \
  --bucket parkease-uploads \
  --cors-configuration file://cors-config.json
```

### 3. Create IAM User

Create an IAM user with S3 permissions:

```bash
aws iam create-user --user-name parkease-s3-user
```

### 4. Create IAM Policy

Create a file `s3-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPutObject",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::parkease-uploads/profile-pictures/*",
      "Condition": {
        "StringEquals": {
          "s3:Content-Type": [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
          ]
        }
      }
    },
    {
      "Sid": "AllowGetObject",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::parkease-uploads/profile-pictures/*"
    },
    {
      "Sid": "AllowDeleteObject",
      "Effect": "Allow",
      "Action": [
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::parkease-uploads/profile-pictures/*"
    },
    {
      "Sid": "AllowListBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::parkease-uploads"
    }
  ]
}
```

Attach the policy:

```bash
aws iam put-user-policy \
  --user-name parkease-s3-user \
  --policy-name parkease-s3-policy \
  --policy-document file://s3-policy.json
```

### 5. Generate Access Keys

```bash
aws iam create-access-key --user-name parkease-s3-user
```

This will output:
```json
{
  "AccessKey": {
    "UserName": "parkease-s3-user",
    "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "Status": "Active",
    "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "CreateDate": "2026-02-20T12:00:00+00:00"
  }
}
```

Use these credentials in your `.env.local` file.

## Bucket Policy (Public Read Access - Optional)

If you want profile pictures to be publicly readable without pre-signed URLs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::parkease-uploads/profile-pictures/*"
    }
  ]
}
```

Apply:

```bash
aws s3api put-bucket-policy \
  --bucket parkease-uploads \
  --policy file://bucket-policy.json
```

## API Endpoints

### 1. Generate Upload URL

**Endpoint:** `POST /api/upload`

**Authentication:** Required (JWT token in Authorization header)

**Request Body:**
```json
{
  "fileName": "profile.jpg",
  "contentType": "image/jpeg",
  "expiresIn": 3600
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://parkease-uploads.s3.us-east-1.amazonaws.com/profile-pictures/1708372800000-abc123-profile.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
    "fileKey": "profile-pictures/1708372800000-abc123-profile.jpg",
    "bucket": "parkease-uploads",
    "expiresIn": 3600
  }
}
```

### 2. Upload File to S3

The client uses the `uploadUrl` from Step 1:

```javascript
const response = await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': 'image/jpeg'
  },
  body: imageFile
});
```

### 3. Store Profile Picture URL

**Endpoint:** `PUT /api/users/profile`

**Authentication:** Required

**Request Body:**
```json
{
  "profilePictureUrl": "https://parkease-uploads.s3.us-east-1.amazonaws.com/profile-pictures/1708372800000-abc123-profile.jpg",
  "profilePictureKey": "profile-pictures/1708372800000-abc123-profile.jpg",
  "name": "John Doe"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@parkease.com",
    "name": "John Doe",
    "role": "USER",
    "profilePictureUrl": "https://...",
    "profilePictureKey": "profile-pictures/...",
    "updatedAt": "2026-02-20T12:00:00Z"
  }
}
```

### 4. Get User Profile

**Endpoint:** `GET /api/users/profile`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@parkease.com",
    "name": "John Doe",
    "role": "USER",
    "profilePictureUrl": "https://parkease-uploads.s3.us-east-1.amazonaws.com/profile-pictures/1708372800000-abc123-profile.jpg",
    "profilePictureKey": "profile-pictures/1708372800000-abc123-profile.jpg",
    "createdAt": "2026-02-19T14:20:50.787Z",
    "updatedAt": "2026-02-20T12:00:00Z"
  }
}
```

## Upload Flow (Client-side)

1. **Get Upload URL**
   ```javascript
   const uploadResponse = await fetch('/api/upload', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify({
       fileName: file.name,
       contentType: file.type
     })
   });
   const { data: uploadData } = await uploadResponse.json();
   ```

2. **Upload File to S3**
   ```javascript
   await fetch(uploadData.uploadUrl, {
     method: 'PUT',
     headers: {
       'Content-Type': file.type
     },
     body: file
   });
   ```

3. **Store URL in Database**
   ```javascript
   await fetch('/api/users/profile', {
     method: 'PUT',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify({
       profilePictureUrl: uploadData.uploadUrl.split('?')[0],
       profilePictureKey: uploadData.fileKey
     })
   });
   ```

## Versioning Strategy

File keys use timestamps and random strings to prevent collisions:
```
profile-pictures/{timestamp}-{random}-{original-filename}
```

Example: `profile-pictures/1708372800000-abc123def-profile.jpg`

## Cleanup

Old profile pictures are automatically deleted when a user uploads a new one. To manually delete:

```bash
aws s3 rm s3://parkease-uploads/profile-pictures/1708372800000-abc123def-profile.jpg
```

## Troubleshooting

### CORS Errors
- Verify CORS configuration includes your frontend origin
- Check that CloudFront (if used) is not caching old CORS headers

### Access Denied
- Verify IAM user has correct permissions
- Check bucket policy doesn't block access
- Verify credentials in `.env.local` are correct

### Expired Pre-signed URLs
- Default expiration is 1 hour (3600 seconds)
- Increase `expiresIn` parameter if needed (max 24 hours)
- Generate a new URL if the old one expires

## Security Best Practices

1. **Restrict file types:** Only allow image uploads in IAM policy
2. **Set file size limits:** Configure S3 bucket limits
3. **Use pre-signed URLs:** Don't expose permanent access credentials
4. **Delete old files:** Automatically clean up when users update profile pictures
5. **Enable versioning:** Consider for audit trails
6. **Enable encryption:** Use S3 server-side encryption (SSE-S3)
7. **Monitor access:** Enable CloudTrail and S3 access logging

## Cost Optimization

- **Lifecycle policies:** Delete old versions/files after 30 days
- **Storage class:** Use STANDARD for frequently accessed images
- **Cloudfront:** Consider CDN for frequent image access
- **Request pricing:** Monitor PUT/GET request counts

## Alternatives

If S3 is not suitable, you can use:
- **Azure Blob Storage:** Similar pre-signed URL approach
- **Google Cloud Storage:** Similar signed URL approach
- **Local file storage:** Simple but requires more server management
- **Cloudinary:** Image hosting service with API
