const Inventory = require('../models/Inventory')

// Helper: get pharmacy filter for admin
const getPharmacyFilter = (user) => {
  if (user.role === 'admin' && user.pharmacyId) return { pharmacyId: user.pharmacyId }
  return {}
}

// @route   GET /api/inventory
// @access  Private (admin, superadmin)
const getAllInventory = async (req, res) => {
  try {
    const filter = getPharmacyFilter(req.user)
    const { search } = req.query
    if (search) filter.medicineName = { $regex: search, $options: 'i' }

    const inventory = await Inventory.find(filter)
      .populate('medicineId', 'name genericName requiresPrescription')
      .populate('pharmacyId', 'name')
      .sort({ createdAt: -1 })

    res.status(200).json({ success: true, count: inventory.length, inventory })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
// Add this function to inventoryController.js

// @route   POST /api/inventory/deduct-stock
// @access  Private (admin, superadmin)
const deductStock = async (req, res) => {
  try {
    const { medicineId, quantity, pharmacyId } = req.body;
    
    if (!medicineId || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Medicine ID and quantity are required' 
      });
    }
    
    // Find inventory item
    let filter = { medicineId };
    if (pharmacyId) {
      filter.pharmacyId = pharmacyId;
    } else if (req.user.pharmacyId) {
      filter.pharmacyId = req.user.pharmacyId;
    }
    
    const inventory = await Inventory.findOne(filter);
    
    if (!inventory) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found in inventory' 
      });
    }
    
    if (inventory.quantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock. Only ${inventory.quantity} units available` 
      });
    }
    
    // Deduct stock
    inventory.quantity -= quantity;
    await inventory.save();
    
    // Check if low stock alert needed
    let lowStockAlert = false;
    if (inventory.quantity <= (inventory.threshold || 10)) {
      lowStockAlert = true;
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Stock deducted successfully',
      data: {
        medicineId: inventory.medicineId,
        medicineName: inventory.medicineName,
        remainingStock: inventory.quantity,
        lowStockAlert
      }
    });
  } catch (error) {
    console.error('Deduct stock error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/inventory/:id/medicine
// @access  Private (admin, superadmin)
const deleteMedicineFromInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findOneAndDelete({ medicineId: req.params.id });
    
    if (!inventory) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found in inventory' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Medicine removed from inventory successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/inventory/:id/restock
// @access  Private (admin, superadmin)
const restockMedicine = async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid quantity is required' 
      });
    }
    
    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    // Add to existing stock
    inventory.quantity += Number(quantity);
    await inventory.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Stock restocked successfully',
      data: {
        medicineId: inventory.medicineId,
        medicineName: inventory.medicineName,
        newStock: inventory.quantity,
        addedQuantity: quantity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @route   GET /api/inventory/alerts/low-stock
// @access  Private (admin)
const getLowStock = async (req, res) => {
  try {
    const filter = getPharmacyFilter(req.user)

    // Get items where quantity is at or below threshold
    const allItems = await Inventory.find(filter)
    const items = allItems.filter(item => item.quantity <= (item.threshold || 10))

    res.status(200).json({ success: true, count: items.length, items })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   GET /api/inventory/alerts/high-demand
// @access  Private (admin)
const getHighDemand = async (req, res) => {
  try {
    const filter = { ...getPharmacyFilter(req.user), isHighDemand: true }
    const items = await Inventory.find(filter)
    res.status(200).json({ success: true, count: items.length, items })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   GET /api/inventory/:id
// @access  Private
const getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id)
      .populate('medicineId', 'name genericName')
      .populate('pharmacyId', 'name address')
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' })
    res.status(200).json({ success: true, item })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   POST /api/inventory
// @access  Private (admin)
const createInventory = async (req, res) => {
  try {
    const { medicineId, medicineName, quantity, unit, price, expiryDate, threshold, location } = req.body

    if (!medicineName || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Medicine name and quantity are required' })
    }

    const data = {
      medicineId, medicineName, quantity: Number(quantity),
      unit, price: price ? Number(price) : undefined,
      expiryDate: expiryDate || undefined,
      threshold: threshold ? Number(threshold) : 10,
      location,
      addedBy: req.user._id,
    }

    if (req.user.pharmacyId) data.pharmacyId = req.user.pharmacyId

    const item = await Inventory.create(data)
    res.status(201).json({ success: true, message: 'Inventory item added', item })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   PUT /api/inventory/:id
// @access  Private (admin)
const updateInventory = async (req, res) => {
  try {
    if (req.body.quantity !== undefined) req.body.quantity = Number(req.body.quantity)
    if (req.body.price !== undefined) req.body.price = Number(req.body.price)
    if (req.body.threshold !== undefined) req.body.threshold = Number(req.body.threshold)

    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' })
    res.status(200).json({ success: true, message: 'Inventory updated', item })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @route   DELETE /api/inventory/:id
// @access  Private (admin)
const deleteInventory = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' })
    res.status(200).json({ success: true, message: 'Inventory item removed' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
// Add these functions at the end of inventoryController.js

// @route   PUT /api/inventory/:id/stock
// @access  Private (admin, superadmin)
const updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    
    if (stock === undefined) {
      return res.status(400).json({ success: false, message: 'Stock quantity is required' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    // Update stock
    item.quantity = Number(stock);
    await item.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Stock updated successfully',
      data: {
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        stock: item.quantity,
        price: item.price,
        pharmacyId: item.pharmacyId
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/medicines/:id/stock
// @access  Private (user)
const getMedicineStock = async (req, res) => {
  try {
    const medicineId = req.params.id;
    
    // Find inventory for this medicine
    let filter = { medicineId };
    
    // For admin users, show their pharmacy's stock
    if (req.user.role === 'admin' && req.user.pharmacyId) {
      filter.pharmacyId = req.user.pharmacyId;
    }
    
    const inventory = await Inventory.find(filter).populate('pharmacyId', 'name');
    
    if (inventory.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: { 
          stock: 0,
          message: 'Medicine not available' 
        } 
      });
    }
    
    // Calculate total stock
    let totalStock = 0;
    let pharmacyStocks = [];
    
    for (const item of inventory) {
      totalStock += item.quantity;
      pharmacyStocks.push({
        pharmacyId: item.pharmacyId?._id || item.pharmacyId,
        pharmacyName: item.pharmacyId?.name || 'Pharmacy',
        stock: item.quantity,
        price: item.price
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: { 
        medicineId,
        totalStock,
        pharmacies: pharmacyStocks
      } 
    });
  } catch (error) {
    console.error('Get medicine stock error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = { getAllInventory, getInventoryById, getLowStock, getHighDemand, createInventory, updateInventory, deleteInventory ,updateStock,
  getMedicineStock ,deductStock,      // Add this
  deleteMedicineFromInventory,  // Add this
  restockMedicine 
}
