const Medicine = require('../models/Medicine')
const Inventory = require('../models/Inventory')
const Pharmacy = require('../models/Pharmacy')

// @route   GET /api/medicines
// @access  Private
const getAllMedicines = async (req, res) => {
  try {
    const { search, category, requiresPrescription } = req.query
    const filter = { isActive: true }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ]
    }
    if (category) filter.category = category
    if (requiresPrescription !== undefined) filter.requiresPrescription = requiresPrescription === 'true'

    // Admin sees only their pharmacy's medicines
    if (req.user.role === 'admin' && req.user.pharmacyId) {
      filter.pharmacyId = req.user.pharmacyId
    }

    const medicines = await Medicine.find(filter).sort({ name: 1 })
    res.status(200).json({ success: true, count: medicines.length, medicines })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   GET /api/medicines/search/nearby
// @access  Private (user)
const searchNearby = async (req, res) => {
  try {
    const { name } = req.query

    if (!name) return res.status(400).json({ success: false, message: 'Medicine name is required' })

    // Find the medicine
    const medicine = await Medicine.findOne({ name: { $regex: name, $options: 'i' }, isActive: true })

    if (!medicine) {
      return res.status(200).json({ success: true, pharmacies: [] })
    }

    // Find inventory items with this medicine that have stock
    const inventoryItems = await Inventory.find({
      $or: [
        { medicineId: medicine._id },
        { medicineName: { $regex: name, $options: 'i' } },
      ],
      quantity: { $gt: 0 },
    }).populate('pharmacyId')

    // Build pharmacy list (deduplicated)
    const pharmacyMap = new Map()
    for (const item of inventoryItems) {
      if (item.pharmacyId && !pharmacyMap.has(item.pharmacyId._id.toString())) {
        pharmacyMap.set(item.pharmacyId._id.toString(), {
          ...item.pharmacyId.toObject(),
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
        })
      }
    }

    // If no inventory found, return all active pharmacies as fallback
    let pharmacies = Array.from(pharmacyMap.values())
    if (pharmacies.length === 0) {
      const allPharmacies = await Pharmacy.find({ status: 'active' }).limit(10)
      pharmacies = allPharmacies.map(p => p.toObject())
    }

    res.status(200).json({ success: true, medicine, pharmacies })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   GET /api/medicines/:id
// @access  Private
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id)
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' })
    res.status(200).json({ success: true, medicine })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   POST /api/medicines
// @access  Private (admin, superadmin)
const createMedicine = async (req, res) => {
  try {
    const { name, genericName, category, manufacturer, dosage, requiresPrescription, description, sideEffects } = req.body

    if (!name) return res.status(400).json({ success: false, message: 'Medicine name is required' })

    const data = { name, genericName, category, manufacturer, dosage, requiresPrescription, description, sideEffects, addedBy: req.user._id }

    if (req.user.role === 'admin' && req.user.pharmacyId) {
      data.pharmacyId = req.user.pharmacyId
    }

    const medicine = await Medicine.create(data)
    res.status(201).json({ success: true, message: 'Medicine added successfully', medicine })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   PUT /api/medicines/:id
// @access  Private (admin, superadmin)
const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' })
    res.status(200).json({ success: true, message: 'Medicine updated successfully', medicine })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   DELETE /api/medicines/:id
// @access  Private (admin, superadmin)
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id)
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' })
    res.status(200).json({ success: true, message: 'Medicine deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getAllMedicines, getMedicineById, searchNearby, createMedicine, updateMedicine, deleteMedicine }
