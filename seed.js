/**
 * Enhanced MedConnect Seed Script
 * Run: node seed.js
 * Creates comprehensive test data for real-time inventory testing
 */

const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config()

const User = require('./models/User')
const Pharmacy = require('./models/Pharmacy')
const Medicine = require('./models/Medicine')
const Inventory = require('./models/Inventory')
const Reservation = require('./models/Reservation')

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing data for fresh test (optional - comment out if you want to keep existing)
    console.log('🗑️  Clearing existing data...')
    await User.deleteMany({})
    await Pharmacy.deleteMany({})
    await Medicine.deleteMany({})
    await Inventory.deleteMany({})
    await Reservation.deleteMany({})
    console.log('✅ All data cleared')

    // ── 1. SUPERADMIN ──────────────────────────────────────────────────────────
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@medconnect.com',
      password: 'superadmin123',
      role: 'superadmin',
      phone: '+91 99999 00000',
      address: 'Chennai Head Office',
    })
    console.log('👑 SuperAdmin created: superadmin@medconnect.com / superadmin123')

    // ── 2. PHARMACIES (Expanded) ──────────────────────────────────────────────
    const pharmacyData = [
      { name: 'Apollo Pharmacy – Anna Nagar', email: 'apollo.annanagar@medconnect.com', phone: '+91 44 2612 3456', address: '15, 2nd Avenue, Anna Nagar', city: 'Chennai', licenseNumber: 'TN-PH-001-2024', status: 'active' },
      { name: 'Apollo Pharmacy – T. Nagar', email: 'apollo.tnagar@medconnect.com', phone: '+91 44 2434 1234', address: '25, Usman Road, T. Nagar', city: 'Chennai', licenseNumber: 'TN-PH-005-2024', status: 'active' },
      { name: 'MedPlus – T. Nagar', email: 'medplus.tnagar@medconnect.com', phone: '+91 44 2434 5678', address: '45, Usman Road, T. Nagar', city: 'Chennai', licenseNumber: 'TN-PH-002-2024', status: 'active' },
      { name: 'MedPlus – Adyar', email: 'medplus.adyar@medconnect.com', phone: '+91 44 2441 2345', address: '12, Lattice Bridge Road, Adyar', city: 'Chennai', licenseNumber: 'TN-PH-006-2024', status: 'active' },
      { name: 'Wellness Forever – Adyar', email: 'wellness.adyar@medconnect.com', phone: '+91 44 2441 9876', address: '78, LB Road, Adyar', city: 'Chennai', licenseNumber: 'TN-PH-003-2024', status: 'active' },
      { name: 'Sakthi Pharmacy – Coimbatore', email: 'sakthi.cbe@medconnect.com', phone: '+91 422 234 5678', address: '23, RS Puram, Coimbatore', city: 'Coimbatore', licenseNumber: 'TN-PH-004-2024', status: 'active' },
      { name: 'Sakthi Pharmacy – Trichy', email: 'sakthi.trichy@medconnect.com', phone: '+91 431 234 5678', address: '45, Cantonment, Trichy', city: 'Trichy', licenseNumber: 'TN-PH-007-2024', status: 'active' },
      { name: 'Sai Pharmacy – Velachery', email: 'sai.velachery@medconnect.com', phone: '+91 44 2244 5678', address: '89, 100 Feet Road, Velachery', city: 'Chennai', licenseNumber: 'TN-PH-008-2024', status: 'pending' },
    ]

    let pharmacies = []
    for (const p of pharmacyData) {
      const pharmacy = await Pharmacy.create(p)
      pharmacies.push(pharmacy)
      console.log(`🏥 Pharmacy created: ${p.name}`)
    }

    // ── 3. ADMIN USERS (one per active pharmacy) ──────────────────────────────
    const adminData = [
      { name: 'Rajan K', email: 'admin.apollo.annanagar@medconnect.com', password: 'admin123', phone: '+91 98765 11111', pharmacyIndex: 0 },
      { name: 'Priya S', email: 'admin.apollo.tnagar@medconnect.com', password: 'admin123', phone: '+91 98765 11112', pharmacyIndex: 1 },
      { name: 'Suresh V', email: 'admin.medplus.tnagar@medconnect.com', password: 'admin123', phone: '+91 98765 22221', pharmacyIndex: 2 },
      { name: 'Deepa R', email: 'admin.medplus.adyar@medconnect.com', password: 'admin123', phone: '+91 98765 22222', pharmacyIndex: 3 },
      { name: 'Karthik M', email: 'admin.wellness.adyar@medconnect.com', password: 'admin123', phone: '+91 98765 33331', pharmacyIndex: 4 },
      { name: 'Lakshmi M', email: 'admin.sakthi.cbe@medconnect.com', password: 'admin123', phone: '+91 98765 44441', pharmacyIndex: 5 },
      { name: 'Arun K', email: 'admin.sakthi.trichy@medconnect.com', password: 'admin123', phone: '+91 98765 44442', pharmacyIndex: 6 },
    ]

    for (const a of adminData) {
      await User.create({
        name: a.name,
        email: a.email,
        password: a.password,
        role: 'admin',
        phone: a.phone,
        pharmacyId: pharmacies[a.pharmacyIndex]._id,
      })
      console.log(`👤 Admin created: ${a.email} / ${a.password}`)
    }

    // ── 4. SAMPLE USERS (More users for testing) ──────────────────────────────
    const userData = [
      { name: 'Ananya Sharma', email: 'user@medconnect.com', password: 'user123', phone: '+91 98765 55555', address: 'Chennai' },
      { name: 'Rajesh Kumar', email: 'rajesh@example.com', password: 'user123', phone: '+91 98765 55556', address: 'Chennai' },
      { name: 'Priya Lakshmi', email: 'priya@example.com', password: 'user123', phone: '+91 98765 55557', address: 'Coimbatore' },
      { name: 'Arun Prakash', email: 'arun@example.com', password: 'user123', phone: '+91 98765 55558', address: 'Trichy' },
      { name: 'Divya S', email: 'divya@example.com', password: 'user123', phone: '+91 98765 55559', address: 'Chennai' },
      { name: 'Manoj K', email: 'manoj@example.com', password: 'user123', phone: '+91 98765 55560', address: 'Coimbatore' },
      { name: 'Kavitha R', email: 'kavitha@example.com', password: 'user123', phone: '+91 98765 55561', address: 'Chennai' },
    ]

    let users = []
    for (const u of userData) {
      const user = await User.create(u)
      users.push(user)
      console.log(`👤 User created: ${u.email} / ${u.password}`)
    }

    // ── 5. MEDICINES (Expanded) ──────────────────────────────────────────────
    const medicineData = [
      // Pain Relief (Analgesics)
      { name: 'Dolo 650', genericName: 'Paracetamol', category: 'Analgesic', manufacturer: 'Micro Labs', dosage: '650mg', requiresPrescription: false, description: 'Fever and mild to moderate pain relief' },
      { name: 'Calpol 500', genericName: 'Paracetamol', category: 'Analgesic', manufacturer: 'GSK', dosage: '500mg', requiresPrescription: false, description: 'Fever and pain relief' },
      { name: 'Combiflam', genericName: 'Ibuprofen+Paracetamol', category: 'Analgesic', manufacturer: 'Sanofi', dosage: '400mg+325mg', requiresPrescription: false, description: 'Anti-inflammatory and painkiller' },
      { name: 'Voveran 50', genericName: 'Diclofenac', category: 'Analgesic', manufacturer: 'Novartis', dosage: '50mg', requiresPrescription: true, description: 'Muscle pain and inflammation' },
      
      // Antibiotics
      { name: 'Azithromycin 500', genericName: 'Azithromycin', category: 'Antibiotic', manufacturer: 'Cipla', dosage: '500mg', requiresPrescription: true, description: 'Bacterial infections' },
      { name: 'Augmentin 625', genericName: 'Amoxicillin+Clavulanate', category: 'Antibiotic', manufacturer: 'GSK', dosage: '625mg', requiresPrescription: true, description: 'Broad-spectrum antibiotic' },
      { name: 'Amoxicillin 500', genericName: 'Amoxicillin', category: 'Antibiotic', manufacturer: 'Alkem', dosage: '500mg', requiresPrescription: true, description: 'Bacterial infections' },
      
      // Antihistamines
      { name: 'Zyrtec 10mg', genericName: 'Cetirizine', category: 'Antihistamine', manufacturer: 'UCB', dosage: '10mg', requiresPrescription: false, description: 'Allergy relief' },
      { name: 'Allegra 120', genericName: 'Fexofenadine', category: 'Antihistamine', manufacturer: 'Sanofi', dosage: '120mg', requiresPrescription: false, description: 'Seasonal allergy relief' },
      
      // Antacids
      { name: 'Omez 20', genericName: 'Omeprazole', category: 'Antacid', manufacturer: 'Dr. Reddy\'s', dosage: '20mg', requiresPrescription: false, description: 'Acid reflux and heartburn' },
      { name: 'Pan 40', genericName: 'Pantoprazole', category: 'Antacid', manufacturer: 'Alkem', dosage: '40mg', requiresPrescription: false, description: 'GERD treatment' },
      
      // Vitamins
      { name: 'Limcee 500', genericName: 'Vitamin C', category: 'Vitamin/Supplement', manufacturer: 'Abbott', dosage: '500mg', requiresPrescription: false, description: 'Immunity booster' },
      { name: 'Corcium', genericName: 'Calcium + Vitamin D3', category: 'Vitamin/Supplement', manufacturer: 'Alkem', dosage: '1 tablet', requiresPrescription: false, description: 'Bone health' },
      { name: 'Becosules', genericName: 'Vitamin B Complex', category: 'Vitamin/Supplement', manufacturer: 'Pfizer', dosage: '1 capsule', requiresPrescription: false, description: 'Energy and nerve health' },
      
      // Cardiac
      { name: 'Telma 40', genericName: 'Telmisartan', category: 'Cardiac', manufacturer: 'Glenmark', dosage: '40mg', requiresPrescription: true, description: 'High blood pressure' },
      { name: 'Atorva 10', genericName: 'Atorvastatin', category: 'Cardiac', manufacturer: 'Zydus Cadila', dosage: '10mg', requiresPrescription: true, description: 'Cholesterol management' },
      
      // Diabetic
      { name: 'Glycomet 500', genericName: 'Metformin', category: 'Diabetic', manufacturer: 'USV', dosage: '500mg', requiresPrescription: true, description: 'Type 2 diabetes' },
      { name: 'Glimy 2', genericName: 'Glimepiride', category: 'Diabetic', manufacturer: 'Sun Pharma', dosage: '2mg', requiresPrescription: true, description: 'Blood sugar control' },
      
      // Respiratory
      { name: 'Montair LC', genericName: 'Montelukast+Levocetirizine', category: 'Respiratory', manufacturer: 'Cipla', dosage: '5mg+5mg', requiresPrescription: true, description: 'Asthma and allergies' },
      { name: 'Deriphyllin', genericName: 'Etofylline', category: 'Respiratory', manufacturer: 'Abbott', dosage: '150mg', requiresPrescription: true, description: 'Asthma and COPD' },
    ]

    let medicines = []
    for (const m of medicineData) {
      const medicine = await Medicine.create({ ...m, addedBy: superAdmin._id, isActive: true })
      medicines.push(medicine)
      console.log(`💊 Medicine created: ${m.name}`)
    }

    // ── 6. INVENTORY (With various stock levels for testing) ─────────────────
    const inventoryData = [
      // Apollo Anna Nagar (pharmacy 0) - Normal stock
      { medicineName: 'Dolo 650', medicineIndex: 0, pharmacyIndex: 0, quantity: 250, price: 29, threshold: 20, unit: 'tablets' },
      { medicineName: 'Calpol 500', medicineIndex: 1, pharmacyIndex: 0, quantity: 180, price: 18, threshold: 15, unit: 'tablets' },
      { medicineName: 'Azithromycin 500', medicineIndex: 4, pharmacyIndex: 0, quantity: 45, price: 89, threshold: 10, unit: 'tablets' },
      { medicineName: 'Zyrtec 10mg', medicineIndex: 7, pharmacyIndex: 0, quantity: 120, price: 55, threshold: 15, unit: 'tablets' },
      { medicineName: 'Omez 20', medicineIndex: 9, pharmacyIndex: 0, quantity: 200, price: 42, threshold: 20, unit: 'capsules' },
      { medicineName: 'Limcee 500', medicineIndex: 11, pharmacyIndex: 0, quantity: 300, price: 18, threshold: 30, unit: 'tablets' },
      
      // Apollo T. Nagar (pharmacy 1) - Low stock alerts
      { medicineName: 'Dolo 650', medicineIndex: 0, pharmacyIndex: 1, quantity: 35, price: 30, threshold: 40, unit: 'tablets' }, // LOW STOCK
      { medicineName: 'Augmentin 625', medicineIndex: 5, pharmacyIndex: 1, quantity: 8, price: 145, threshold: 10, unit: 'strips' }, // LOW STOCK
      { medicineName: 'Allegra 120', medicineIndex: 8, pharmacyIndex: 1, quantity: 95, price: 110, threshold: 10, unit: 'tablets' },
      { medicineName: 'Pan 40', medicineIndex: 10, pharmacyIndex: 1, quantity: 160, price: 38, threshold: 15, unit: 'tablets' },
      
      // MedPlus T. Nagar (pharmacy 2) - High stock
      { medicineName: 'Dolo 650', medicineIndex: 0, pharmacyIndex: 2, quantity: 400, price: 30, threshold: 30, unit: 'tablets' },
      { medicineName: 'Azithromycin 500', medicineIndex: 4, pharmacyIndex: 2, quantity: 60, price: 85, threshold: 12, unit: 'tablets' },
      { medicineName: 'Zyrtec 10mg', medicineIndex: 7, pharmacyIndex: 2, quantity: 180, price: 52, threshold: 20, unit: 'tablets' },
      { medicineName: 'Glycomet 500', medicineIndex: 16, pharmacyIndex: 2, quantity: 45, price: 28, threshold: 8, unit: 'tablets' },
      
      // MedPlus Adyar (pharmacy 3) - Out of stock items
      { medicineName: 'Combiflam', medicineIndex: 2, pharmacyIndex: 3, quantity: 0, price: 28, threshold: 15, unit: 'tablets' }, // OUT OF STOCK
      { medicineName: 'Augmentin 625', medicineIndex: 5, pharmacyIndex: 3, quantity: 5, price: 150, threshold: 10, unit: 'strips' }, // LOW STOCK
      { medicineName: 'Corcium', medicineIndex: 12, pharmacyIndex: 3, quantity: 95, price: 92, threshold: 10, unit: 'tablets' },
      { medicineName: 'Becosules', medicineIndex: 13, pharmacyIndex: 3, quantity: 220, price: 95, threshold: 20, unit: 'capsules' },
      
      // Wellness Forever (pharmacy 4) - Critical low stock
      { medicineName: 'Dolo 650', medicineIndex: 0, pharmacyIndex: 4, quantity: 12, price: 29, threshold: 25, unit: 'tablets' }, // CRITICAL
      { medicineName: 'Amoxicillin 500', medicineIndex: 6, pharmacyIndex: 4, quantity: 3, price: 45, threshold: 10, unit: 'tablets' }, // CRITICAL
      { medicineName: 'Zyrtec 10mg', medicineIndex: 7, pharmacyIndex: 4, quantity: 150, price: 53, threshold: 15, unit: 'tablets' },
      { medicineName: 'Montair LC', medicineIndex: 18, pharmacyIndex: 4, quantity: 7, price: 75, threshold: 10, unit: 'tablets' }, // LOW STOCK
      
      // Sakthi Coimbatore (pharmacy 5) - Normal
      { medicineName: 'Dolo 650', medicineIndex: 0, pharmacyIndex: 5, quantity: 500, price: 28, threshold: 40, unit: 'tablets' },
      { medicineName: 'Calpol 500', medicineIndex: 1, pharmacyIndex: 5, quantity: 210, price: 17, threshold: 20, unit: 'tablets' },
      { medicineName: 'Azithromycin 500', medicineIndex: 4, pharmacyIndex: 5, quantity: 55, price: 87, threshold: 10, unit: 'tablets' },
      { medicineName: 'Telma 40', medicineIndex: 14, pharmacyIndex: 5, quantity: 80, price: 68, threshold: 10, unit: 'tablets' },
      
      // Sakthi Trichy (pharmacy 6) - Mixed
      { medicineName: 'Dolo 650', medicineIndex: 0, pharmacyIndex: 6, quantity: 350, price: 29, threshold: 30, unit: 'tablets' },
      { medicineName: 'Voveran 50', medicineIndex: 3, pharmacyIndex: 6, quantity: 85, price: 35, threshold: 12, unit: 'tablets' },
      { medicineName: 'Pan 40', medicineIndex: 10, pharmacyIndex: 6, quantity: 140, price: 39, threshold: 15, unit: 'tablets' },
      { medicineName: 'Deriphyllin', medicineIndex: 19, pharmacyIndex: 6, quantity: 45, price: 42, threshold: 8, unit: 'tablets' },
    ]

    for (const inv of inventoryData) {
      const med = medicines[inv.medicineIndex]
      const phar = pharmacies[inv.pharmacyIndex]
      if (!med || !phar) continue
      
      await Inventory.create({
        medicineId: med._id,
        medicineName: med.name,
        pharmacyId: phar._id,
        quantity: inv.quantity,
        price: inv.price,
        unit: inv.unit,
        threshold: inv.threshold,
        addedBy: superAdmin._id,
      })
    }
    console.log(`📦 Inventory seeded: ${inventoryData.length} items`)

    // ── 7. RESERVATIONS (Orders for testing) ─────────────────────────────────
    const reservationData = [
      // Completed orders
      { userIndex: 0, medicineIndex: 0, pharmacyIndex: 0, quantity: 2, status: 'completed', notes: 'Fever' },
      { userIndex: 1, medicineIndex: 4, pharmacyIndex: 0, quantity: 1, status: 'completed', notes: 'Infection' },
      { userIndex: 2, medicineIndex: 7, pharmacyIndex: 2, quantity: 1, status: 'completed', notes: 'Allergy' },
      
      // Pending orders
      { userIndex: 0, medicineIndex: 0, pharmacyIndex: 1, quantity: 3, status: 'pending', notes: 'Fever for 2 days' },
      { userIndex: 3, medicineIndex: 5, pharmacyIndex: 1, quantity: 1, status: 'pending', notes: 'Throat infection' },
      { userIndex: 4, medicineIndex: 10, pharmacyIndex: 3, quantity: 2, status: 'pending', notes: 'Acid reflux' },
      { userIndex: 5, medicineIndex: 12, pharmacyIndex: 4, quantity: 1, status: 'pending', notes: 'Calcium supplement' },
      { userIndex: 6, medicineIndex: 16, pharmacyIndex: 2, quantity: 2, status: 'pending', notes: 'Diabetes management' },
      
      // Confirmed orders
      { userIndex: 1, medicineIndex: 2, pharmacyIndex: 3, quantity: 1, status: 'confirmed', notes: 'Pain relief' },
      { userIndex: 2, medicineIndex: 8, pharmacyIndex: 4, quantity: 1, status: 'confirmed', notes: 'Allergy' },
      { userIndex: 3, medicineIndex: 14, pharmacyIndex: 5, quantity: 2, status: 'confirmed', notes: 'Blood pressure' },
      
      // Rejected orders
      { userIndex: 4, medicineIndex: 6, pharmacyIndex: 4, quantity: 1, status: 'rejected', notes: 'Out of stock', statusNote: 'Medicine not available' },
      { userIndex: 5, medicineIndex: 18, pharmacyIndex: 4, quantity: 1, status: 'rejected', notes: 'Prescription required', statusNote: 'Please upload prescription' },
    ]

    for (const r of reservationData) {
      const user = users[r.userIndex]
      const med = medicines[r.medicineIndex]
      const phar = pharmacies[r.pharmacyIndex]
      
      if (!user || !med || !phar) continue
      
      await Reservation.create({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        medicineId: med._id,
        medicineName: med.name,
        pharmacyId: phar._id,
        pharmacyName: phar.name,
        quantity: r.quantity,
        status: r.status,
        notes: r.notes,
        statusNote: r.statusNote || null,
        hasPrescription: med.requiresPrescription,
      })
    }
    console.log(`📋 Reservations seeded: ${reservationData.length} orders`)

    // ── SUMMARY ───────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════════')
    console.log('🎉  SEED COMPLETE — Test Credentials')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('')
    console.log('👑 SUPER ADMIN (Full System Access)')
    console.log('   Email   : superadmin@medconnect.com')
    console.log('   Password: superadmin123')
    console.log('')
    console.log('🏥 ADMIN USERS (Pharmacy Level Access)')
    console.log('   1. Apollo Anna Nagar  → admin.apollo.annanagar@medconnect.com / admin123')
    console.log('   2. Apollo T. Nagar   → admin.apollo.tnagar@medconnect.com / admin123')
    console.log('   3. MedPlus T. Nagar  → admin.medplus.tnagar@medconnect.com / admin123')
    console.log('   4. MedPlus Adyar     → admin.medplus.adyar@medconnect.com / admin123')
    console.log('   5. Wellness Forever  → admin.wellness.adyar@medconnect.com / admin123')
    console.log('   6. Sakthi Coimbatore → admin.sakthi.cbe@medconnect.com / admin123')
    console.log('   7. Sakthi Trichy     → admin.sakthi.trichy@medconnect.com / admin123')
    console.log('')
    console.log('👤 SAMPLE USERS')
    console.log('   user@medconnect.com / user123')
    console.log('   rajesh@example.com / user123')
    console.log('   priya@example.com / user123')
    console.log('   arun@example.com / user123')
    console.log('   divya@example.com / user123')
    console.log('   manoj@example.com / user123')
    console.log('   kavitha@example.com / user123')
    console.log('')
    console.log('📊 DATA SUMMARY')
    console.log(`   - Pharmacies: ${pharmacies.length}`)
    console.log(`   - Medicines: ${medicines.length}`)
    console.log(`   - Inventory Items: ${inventoryData.length}`)
    console.log(`   - Reservations: ${reservationData.length}`)
    console.log(`   - Users: ${users.length + adminData.length + 1}`)
    console.log('')
    console.log('🔍 TEST SCENARIOS:')
    console.log('   1. Check LOW STOCK alerts at Apollo T. Nagar')
    console.log('   2. Check OUT OF STOCK at MedPlus Adyar (Combiflam)')
    console.log('   3. Check CRITICAL low stock at Wellness Forever (Dolo 650: 12 units)')
    console.log('   4. Place an order as user@medconnect.com and see stock decrease')
    console.log('   5. Admin updates stock and user sees real-time change')
    console.log('═══════════════════════════════════════════════════════════════\n')

    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
    process.exit(0)
  } catch (err) {
    console.error('❌ Seed error:', err.message)
    await mongoose.disconnect()
    process.exit(1)
  }
}

seed()