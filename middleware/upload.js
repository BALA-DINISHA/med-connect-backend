const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/prescriptions')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Function to detect file type from buffer
const detectFileType = (buffer) => {
  if (buffer.length < 4) return null
  
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png'
  }
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg'
  }
  // PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf'
  }
  // WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return 'image/webp'
  }
  return null
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Get file extension
    let ext = path.extname(file.originalname).toLowerCase()
    
    // If no extension, determine from mimetype
    if (!ext || ext === '.') {
      switch (file.mimetype) {
        case 'image/jpeg':
        case 'image/jpg':
          ext = '.jpg'
          break
        case 'image/png':
          ext = '.png'
          break
        case 'application/pdf':
          ext = '.pdf'
          break
        default:
          ext = '.jpg'
      }
    }
    
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `prescription-${uniqueSuffix}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  // Allowed mime types
  const allowedMimes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp',  // Add WEBP support for camera captures
    'application/pdf'
  ]
  
  // Allowed extensions
  const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf', '.webp']
  const ext = path.extname(file.originalname).toLowerCase()
  
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, PNG, WEBP, and PDF files are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

module.exports = upload