const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth')
const {
  getAllMedicines, getMedicineById, searchNearby,
  createMedicine, updateMedicine, deleteMedicine
} = require('../controllers/medicineController')
const { getMedicineStock } = require('../controllers/inventoryController')
router.use(protect)

router.get('/search/nearby', searchNearby)
router.get('/', getAllMedicines)
router.get('/:id', getMedicineById)
router.get('/:id/stock', getMedicineStock)
router.post('/', authorize('admin', 'superadmin'), createMedicine)
router.put('/:id', authorize('admin', 'superadmin'), updateMedicine)
router.delete('/:id', authorize('admin', 'superadmin'), deleteMedicine)

module.exports = router
