// routes/reservationRoutes.js
const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth')
const upload = require('../middleware/upload')
const {
  getAllReservations, getMyReservations, getReservationById,
  createReservation, updateReservation, updateStatus, deleteReservation,
  uploadPrescription, viewPrescription, placeOrder
} = require('../controllers/reservationController')

router.use(protect)

// User routes
router.get('/my', getMyReservations)
router.post('/', authorize('user'), upload.single('prescription'), createReservation)
router.delete('/:id', authorize('user', 'admin', 'superadmin'), deleteReservation)
router.post('/:id/prescription', authorize('user'), upload.single('prescription'), uploadPrescription)
router.get('/:id/prescription', viewPrescription)
router.post('/orders', placeOrder)  // ← Make sure this line exists

// Admin / superadmin routes
router.get('/', authorize('admin', 'superadmin'), getAllReservations)
router.put('/:id/status', authorize('admin', 'superadmin'), updateStatus)
router.put('/:id', updateReservation)
router.get('/:id', getReservationById)

module.exports = router