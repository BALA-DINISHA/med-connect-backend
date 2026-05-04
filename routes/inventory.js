const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth')
const {
  getAllInventory, getInventoryById, getLowStock, getHighDemand,
  createInventory, updateInventory, deleteInventory,
   updateStock,  // Add this
  getMedicineStock , deductStock, deleteMedicineFromInventory, restockMedicine // Add this
} = require('../controllers/inventoryController')

router.use(protect)
router.use(authorize('admin', 'superadmin'))

router.get('/alerts/low-stock', getLowStock)
router.get('/alerts/high-demand', getHighDemand)
router.get('/', getAllInventory)
router.get('/:id', getInventoryById)
router.post('/', createInventory)
router.put('/:id', updateInventory)
router.put('/:id/stock', updateStock)
router.delete('/:id', deleteInventory)
router.post('/deduct-stock', deductStock)  // Add this
router.put('/:id/restock', restockMedicine)  // Add this
router.delete('/:id/medicine', deleteMedicineFromInventory)  
module.exports = router
