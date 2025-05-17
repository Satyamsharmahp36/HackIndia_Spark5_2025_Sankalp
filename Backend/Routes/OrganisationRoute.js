const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const Organization = require('../Schema/Organisation');
const Department   = require('../Schema/Department');

// ─────────────────────────────────────────────────────────────
//  POST /organizations/register
// ─────────────────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('orgName').notEmpty().withMessage('Organization name is required'),
    body('industry').notEmpty().withMessage('Industry is required'),
    body('size').notEmpty().withMessage('Company size is required'),
    body('domain').notEmpty().withMessage('Domain is required'),

    body('adminFirstName').notEmpty().withMessage('Admin first name is required'),
    body('adminLastName').notEmpty().withMessage('Admin last name is required'),
    body('adminEmail').isEmail().withMessage('Valid admin email is required'),
    body('adminPassword')
      .isLength({ min: 8 })
      .withMessage('Admin password must be at least 8 characters'),

    body('departments')
      .isArray({ min: 1 })
      .withMessage('Departments must be a non-empty array'),
    body('departments.*').notEmpty().withMessage('Department name cannot be empty')
  ],
  async (req, res) => {
    // ─── 1. Input validation ───────────────────────────────
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const {
      orgName,
      industry,
      size,
      domain,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      ssoEnabled,
      ssoProvider,
      departments
    } = req.body;

    try {
      // ─── 2. Uniqueness checks ────────────────────────────
    //   if (await Organization.exists({ domain: domain.toLowerCase().trim() }))
    //     return res
    //       .status(400)
    //       .json({ msg: 'Organization with this domain already exists' });

      if (await Organization.exists({ 'admin.email': adminEmail.toLowerCase().trim() }))
        return res
          .status(400)
          .json({ msg: 'Admin with this email already exists' });

      // ─── 3. Build admin sub-doc ──────────────────────────
      const admin = {
        firstName:  adminFirstName,
        lastName:   adminLastName,
        email:      adminEmail.toLowerCase().trim(),
        password:   await bcrypt.hash(adminPassword, 10),
        role:       'admin',
        isVerified: true
      };

      // ─── 4. Create organization ─────────────────────────
      const organization = await Organization.create({
        name:     orgName,
        industry,
        size,
        domain:   domain.toLowerCase().trim(),
        admin,
        ssoConfig: {
          enabled:  !!ssoEnabled,
          provider: ssoEnabled ? ssoProvider : null
        }
      });

      // ─── 5. Create departments ──────────────────────────
      const departmentDocs = await Promise.all(
        departments.map(name =>
          Department.create({
            name,
            organizationId: organization._id,
            createdBy: {
              firstName: admin.firstName,
              lastName:  admin.lastName,
              email:     admin.email,
              role:      'admin'
            },
            managers: []
          })
        )
      );

      // link them back
      organization.departments = departmentDocs.map(d => d._id);
      await organization.save();

      // ─── 6. Issue JWT ───────────────────────────────────
      const token = jwt.sign(
        {
          orgId: organization._id,
          email: admin.email,
          role:  admin.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      // ─── 7. Response ────────────────────────────────────
      res.status(201).json({
        success: true,
        organization: {
          id:     organization._id,
          name:   organization.name,
          domain: organization.domain
        },
        admin: {
          name:  `${admin.firstName} ${admin.lastName}`,
          email: admin.email
        },
        departments: departmentDocs.map(d => ({
          id: d._id,
          name: d.name
        })),
        token
      });
    } catch (err) {
      console.error('Organization registration error:', err);
      res.status(500).json({ msg: 'Server error', error: err.message });
    }
  }
);

module.exports = router;
