const Reservation = require('../models/Reservation')
const path = require('path')
const fs = require('fs')
const Medicine = require('../models/Medicine')  // ← ADD THIS
const Inventory = require('../models/Inventory') 
// @route   GET /api/reservations
// @access  Private (admin, superadmin)
const getAllReservations = async (req, res) => {
  try {
    let filter = {}

    // Admin sees only reservations for their pharmacy
    if (req.user.role === 'admin' && req.user.pharmacyId) {
      filter.pharmacyId = req.user.pharmacyId
    }

    const { status, search } = req.query
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { medicineName: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
      ]
    }

    const reservations = await Reservation.find(filter)
      .populate('userId', 'name email phone')
      .populate('medicineId', 'name genericName requiresPrescription')
      .populate('pharmacyId', 'name address phone')
      .sort({ createdAt: -1 })

    res.status(200).json({ success: true, count: reservations.length, reservations })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   GET /api/reservations/my
// @access  Private (user)
const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user._id })
      .populate('medicineId', 'name genericName requiresPrescription')
      .populate('pharmacyId', 'name address phone')
      .sort({ createdAt: -1 })

    res.status(200).json({ success: true, count: reservations.length, reservations })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   GET /api/reservations/:id
// @access  Private
const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('medicineId', 'name genericName')
      .populate('pharmacyId', 'name address phone')

    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' })

    // Only owner or pharmacy admin or superadmin can view
    if (
      req.user.role === 'user' &&
      reservation.userId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    res.status(200).json({ success: true, reservation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   POST /api/reservations
// @access  Private (user)
const createReservation = async (req, res) => {
  try {
    const { medicineId, medicineName, pharmacyId, pharmacyName, quantity, notes } = req.body

    // Add debug logs
    console.log('📦 Create reservation request:')
    console.log('  - Medicine:', medicineName)
    console.log('  - Quantity:', quantity)
    console.log('  - File received:', req.file ? 'YES' : 'NO')
    
    if (req.file) {
      console.log('  - File details:', {
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      })
    }

    if (!medicineName) {
      return res.status(400).json({ success: false, message: 'Medicine name is required' })
    }

    const reservationData = {
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      medicineId: medicineId || undefined,
      medicineName,
      pharmacyId: pharmacyId || undefined,
      pharmacyName: pharmacyName || '',
      quantity: quantity ? Number(quantity) : 1,
      notes: notes || '',
      status: 'pending',
    }

    // Handle prescription file upload
    if (req.file) {
      reservationData.hasPrescription = true
      reservationData.prescriptionFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        path: req.file.path,
        uploadedAt: new Date(),
      }
    }

    const reservation = await Reservation.create(reservationData)
    
    console.log('✅ Reservation created:', reservation._id)
    
    res.status(201).json({ 
      success: true, 
      message: 'Reservation created successfully', 
      reservation 
    })
  } catch (error) {
    console.error('❌ Create reservation error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
// @route   PUT /api/reservations/:id/status
// @access  Private (admin, superadmin)
const updateStatus = async (req, res) => {
  try {
    const { status, statusNote } = req.body

    const validStatuses = ['pending', 'confirmed', 'success', 'completed', 'rejected', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }

    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' })

    reservation.status = status
    if (statusNote) reservation.statusNote = statusNote

    // Auto-delete prescription after completion
    if (['success', 'completed'].includes(status)) {
      if (reservation.prescriptionFile && reservation.prescriptionFile.path) {
        const filePath = reservation.prescriptionFile.path
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
        reservation.prescriptionFile = undefined
        reservation.hasPrescription = false
        reservation.prescriptionDeleted = true
      }
    }

    await reservation.save()
    res.status(200).json({ success: true, message: 'Reservation status updated', reservation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   PUT /api/reservations/:id
// @access  Private (user - own reservation only, or admin)
const updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' })

    // Users can only update their own reservations
    if (req.user.role === 'user' && reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    const updated = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.status(200).json({ success: true, message: 'Reservation updated', reservation: updated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   DELETE /api/reservations/:id
// @access  Private (user - own only)
const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' })

    // Only user can delete their own reservations
    if (req.user.role === 'user' && reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    // Cannot delete completed reservations
    if (['success', 'completed'].includes(reservation.status)) {
      return res.status(400).json({ success: false, message: 'Cannot delete a completed reservation' })
    }

    // Delete prescription file if exists
    if (reservation.prescriptionFile?.path && fs.existsSync(reservation.prescriptionFile.path)) {
      fs.unlinkSync(reservation.prescriptionFile.path)
    }

    await Reservation.findByIdAndDelete(req.params.id)
    res.status(200).json({ success: true, message: 'Reservation deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   POST /api/reservations/:id/prescription
// @access  Private (user)
const uploadPrescription = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' })

    if (reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

    // Delete old prescription if exists
    if (reservation.prescriptionFile?.path && fs.existsSync(reservation.prescriptionFile.path)) {
      fs.unlinkSync(reservation.prescriptionFile.path)
    }

    reservation.hasPrescription = true
    reservation.prescriptionFile = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      path: req.file.path,
      uploadedAt: new Date(),
    }

    await reservation.save()
    res.status(200).json({ success: true, message: 'Prescription uploaded successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   GET /api/reservations/:id/prescription
// @access  Private (admin - only after reservation completed, or user who owns it)
const viewPrescription = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' })

    // Admin can only view prescription if reservation is pending/confirmed (not yet completed)
    if (req.user.role === 'admin') {
      if (['success', 'completed'].includes(reservation.status)) {
        return res.status(403).json({ success: false, message: 'Prescription has been deleted after completion' })
      }
    }

    if (reservation.prescriptionDeleted || !reservation.prescriptionFile) {
      return res.status(404).json({ success: false, message: 'No prescription found or it has been deleted' })
    }

    const filePath = reservation.prescriptionFile.path
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Prescription file not found on server' })
    }

    res.setHeader('Content-Type', reservation.prescriptionFile.mimetype || 'application/octet-stream')
    res.setHeader('Content-Disposition', `inline; filename="${reservation.prescriptionFile.originalName}"`)
    res.sendFile(path.resolve(filePath))
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Add this at the end of reservationController.js

// @route   POST /api/orders
// @access  Private (user)
// Update the placeOrder function in reservationController.js
// @route   POST /api/reservations/orders
// @access  Private (user)
const placeOrder = async (req, res) => {
  try {
    const { medicineId, quantity, pharmacyId } = req.body;
    
    console.log('📦 Place order request:', { medicineId, quantity, pharmacyId });
    
    if (!medicineId) {
      return res.status(400).json({ success: false, message: 'Medicine ID is required' });
    }
    
    const orderQuantity = quantity || 1;
    
    // Find medicine
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      console.log('❌ Medicine not found:', medicineId);
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }
    
    console.log('✅ Medicine found:', medicine.name);
    
    // Find inventory
    let filter = { medicineId };
    if (pharmacyId) {
      filter.pharmacyId = pharmacyId;
    }
    
    const inventory = await Inventory.findOne(filter);
    if (!inventory) {
      console.log('❌ Inventory not found for medicine:', medicineId);
      return res.status(404).json({ success: false, message: 'Medicine not found in inventory' });
    }
    
    console.log('📊 Current stock:', inventory.quantity);
    
    if (inventory.quantity < orderQuantity) {
      console.log('❌ Insufficient stock. Available:', inventory.quantity, 'Requested:', orderQuantity);
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock. Only ${inventory.quantity} units available` 
      });
    }
    
    // DEDUCT STOCK HERE
    inventory.quantity -= orderQuantity;
    await inventory.save();
    
    console.log('✅ Stock deducted. Remaining:', inventory.quantity);
    
    // Create reservation record
    const reservation = await Reservation.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      medicineId: medicine._id,
      medicineName: medicine.name,
      pharmacyId: inventory.pharmacyId,
      pharmacyName: inventory.pharmacyName || 'Pharmacy',
      quantity: orderQuantity,
      status: 'pending',
      notes: 'Direct order placed'
    });
    
    console.log('✅ Order created:', reservation._id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Order placed successfully',
      data: {
        reservation,
        remainingStock: inventory.quantity
      }
    });
  } catch (error) {
    console.error('❌ Place order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllReservations, getMyReservations, getReservationById,
  createReservation, updateReservation, updateStatus, deleteReservation,
  uploadPrescription, viewPrescription,placeOrder
}
