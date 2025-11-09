/**
 * ============================================================================
 * Upload Routes - File/Image Upload API
 * ============================================================================
 * Endpoints for uploading images and storing them in project extra data
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// ============================================================================
// POST /api/upload/project-image/:projectId - Upload image for project
// ============================================================================
router.post('/project-image/:projectId', upload.single('image'), async (req, res) => {
    try {
        const { projectId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Get the project
        const projectQuery = 'SELECT id, extra FROM project.projects WHERE id = $1';
        const projectResult = await pool.query(projectQuery, [projectId]);
        
        if (projectResult.rows.length === 0) {
            // Delete uploaded file if project not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Create image URL
        const imageUrl = `/uploads/${req.file.filename}`;
        
        // Update project extra data with image info
        const currentExtra = projectResult.rows[0].extra || {};
        const updatedExtra = {
            ...currentExtra,
            image: {
                url: imageUrl,
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                uploadedAt: new Date().toISOString()
            }
        };

        const updateQuery = `
            UPDATE project.projects 
            SET extra = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;
        
        await pool.query(updateQuery, [JSON.stringify(updatedExtra), projectId]);

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                imageUrl: imageUrl,
                filename: req.file.filename
            }
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
});

// ============================================================================
// POST /api/upload/project-image-base64/:projectId - Upload base64 image
// ============================================================================
router.post('/project-image-base64/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { imageBase64, filename } = req.body;
        
        if (!imageBase64) {
            return res.status(400).json({
                success: false,
                message: 'No image data provided'
            });
        }

        // Get the project
        const projectQuery = 'SELECT id, extra FROM project.projects WHERE id = $1';
        const projectResult = await pool.query(projectQuery, [projectId]);
        
        if (projectResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Update project extra data with base64 image
        const currentExtra = projectResult.rows[0].extra || {};
        const updatedExtra = {
            ...currentExtra,
            image: {
                base64: imageBase64,
                filename: filename || 'uploaded-image',
                uploadedAt: new Date().toISOString()
            }
        };

        const updateQuery = `
            UPDATE project.projects 
            SET extra = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;
        
        await pool.query(updateQuery, [JSON.stringify(updatedExtra), projectId]);

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                filename: filename || 'uploaded-image'
            }
        });

    } catch (error) {
        console.error('Error uploading base64 image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
});

// ============================================================================
// DELETE /api/upload/project-image/:projectId - Remove project image
// ============================================================================
router.delete('/project-image/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        // Get the project
        const projectQuery = 'SELECT id, extra FROM project.projects WHERE id = $1';
        const projectResult = await pool.query(projectQuery, [projectId]);
        
        if (projectResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const currentExtra = projectResult.rows[0].extra || {};
        
        // Delete physical file if it exists
        if (currentExtra.image && currentExtra.image.filename) {
            const filePath = path.join(uploadsDir, currentExtra.image.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Remove image from extra data
        const { image, ...restExtra } = currentExtra;
        
        const updateQuery = `
            UPDATE project.projects 
            SET extra = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;
        
        await pool.query(updateQuery, [JSON.stringify(restExtra), projectId]);

        res.status(200).json({
            success: true,
            message: 'Image removed successfully'
        });

    } catch (error) {
        console.error('Error removing image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove image',
            error: error.message
        });
    }
});

module.exports = router;
