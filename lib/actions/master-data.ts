"use server"

import { sql } from "@/lib/db"

// Business Unit Groups
export async function getBusinessUnitGroups() {
  try {
    const result = await sql`
      SELECT * FROM business_unit_groups
      ORDER BY name ASC
    `
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching business unit groups:", error)
    return { success: false, error: "Failed to fetch business unit groups", data: [] }
  }
}

export async function createBusinessUnitGroup(name: string, description?: string, spocName?: string) {
  try {
    const trimmedName = name.trim()
    const result = await sql`
      INSERT INTO business_unit_groups (name, description, spoc_name)
      VALUES (${trimmedName}, ${description || null}, ${spocName || null})
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to create business unit group - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error: any) {
    if (error.message?.includes("duplicate key") || error.detail?.includes("already exists")) {
      return { success: false, error: `Business unit group with this name already exists`, isDuplicate: true }
    }
    console.error("Error creating business unit group:", error)
    return { success: false, error: "Failed to create business unit group" }
  }
}

export async function updateBusinessUnitGroup(id: number, name: string, description?: string, spocName?: string) {
  try {
    const trimmedName = name.trim()
    const result = await sql`
      UPDATE business_unit_groups
      SET name = ${trimmedName}, description = ${description || null}, spoc_name = ${spocName || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to update business unit group - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error: any) {
    if (error.message?.includes("duplicate key") || error.detail?.includes("already exists")) {
      return { success: false, error: `Business unit group with this name already exists`, isDuplicate: true }
    }
    console.error("Error updating business unit group:", error)
    return { success: false, error: "Failed to update business unit group" }
  }
}

export async function deleteBusinessUnitGroup(id: number) {
  try {
    await sql`DELETE FROM business_unit_groups WHERE id = ${id}`
    return { success: true }
  } catch (error) {
    console.error("Error deleting business unit group:", error)
    return { success: false, error: "Failed to delete business unit group" }
  }
}

// Categories
export async function getCategories() {
  try {
    const result = await sql`
      SELECT * FROM categories 
      ORDER BY name ASC
    `
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching categories:", error)
    return { success: false, error: "Failed to fetch categories", data: [] }
  }
}

export async function createCategory(name: string, description?: string) {
  try {
    const trimmedName = name.trim()
    const result = await sql`
      INSERT INTO categories (name, description)
      VALUES (${trimmedName}, ${description || null})
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to create category - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error: any) {
    if (error.message?.includes("duplicate key") || error.detail?.includes("already exists")) {
      return { success: false, error: `Category with this name already exists`, isDuplicate: true }
    }
    console.error("Error creating category:", error)
    return { success: false, error: "Failed to create category" }
  }
}

export async function updateCategory(id: number, name: string, description?: string) {
  try {
    const trimmedName = name.trim()
    const result = await sql`
      UPDATE categories 
      SET name = ${trimmedName}, description = ${description || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to update category - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error: any) {
    if (error.message?.includes("duplicate key") || error.detail?.includes("already exists")) {
      return { success: false, error: `Category with this name already exists`, isDuplicate: true }
    }
    console.error("Error updating category:", error)
    return { success: false, error: "Failed to update category" }
  }
}

export async function deleteCategory(id: number) {
  try {
    await sql`DELETE FROM categories WHERE id = ${id}`
    return { success: true }
  } catch (error) {
    console.error("Error deleting category:", error)
    return { success: false, error: "Failed to delete category" }
  }
}

// Subcategories
export async function getSubcategories(categoryId?: number) {
  try {
    const result = categoryId
      ? await sql`
          SELECT s.id, s.category_id, s.name, s.description,
                 s.input_template, s.estimated_duration_minutes, s.closure_steps,
                 c.name as category_name
          FROM subcategories s
          JOIN categories c ON s.category_id = c.id
          WHERE s.category_id = ${categoryId}
          ORDER BY s.name ASC
        `
      : await sql`
          SELECT s.id, s.category_id, s.name, s.description,
                 s.input_template, s.estimated_duration_minutes, s.closure_steps,
                 c.name as category_name
          FROM subcategories s
          JOIN categories c ON s.category_id = c.id
          ORDER BY c.name, s.name ASC
        `
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching subcategories:", error)
    return { success: false, error: "Failed to fetch subcategories", data: [] }
  }
}

// Get subcategory details for auto-fill (template, duration, closure steps)
export async function getSubcategoryDetails(subcategoryId: number) {
  try {
    const result = await sql`
      SELECT
        s.id, s.name, s.input_template, s.estimated_duration_minutes, s.closure_steps,
        c.id as category_id, c.name as category_name
      FROM subcategories s
      JOIN categories c ON s.category_id = c.id
      WHERE s.id = ${subcategoryId}
    `
    return { success: true, data: result.length > 0 ? result[0] : null }
  } catch (error) {
    console.error("Error fetching subcategory details:", error)
    return { success: false, error: "Failed to fetch subcategory details", data: null }
  }
}

export async function createSubcategory(categoryId: number, name: string, description?: string) {
  try {
    const trimmedName = name.trim()
    const result = await sql`
      INSERT INTO subcategories (category_id, name, description)
      VALUES (${categoryId}, ${trimmedName}, ${description || null})
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to create subcategory - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error: any) {
    if (error.message?.includes("duplicate key") || error.detail?.includes("already exists")) {
      return { success: false, error: `Subcategory with this name already exists in this category`, isDuplicate: true }
    }
    console.error("Error creating subcategory:", error)
    return { success: false, error: "Failed to create subcategory" }
  }
}

export async function updateSubcategory(id: number, name: string, description?: string) {
  try {
    const result = await sql`
      UPDATE subcategories 
      SET name = ${name}, description = ${description || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to update subcategory - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error updating subcategory:", error)
    return { success: false, error: "Failed to update subcategory" }
  }
}

export async function deleteSubcategory(id: number) {
  try {
    // Check if there are any tickets referencing this subcategory
    const ticketsCheck = await sql`
      SELECT COUNT(*) as count FROM tickets WHERE subcategory_id = ${id}
    `

    const ticketCount = ticketsCheck.rows?.[0]?.count || 0

    if (ticketCount > 0) {
      return {
        success: false,
        error: `Cannot delete subcategory: ${ticketCount} ticket(s) still reference this subcategory. Please reassign or delete the tickets first.`,
        dependentCount: ticketCount,
      }
    }

    // Check if there are any mappings referencing this subcategory
    const mappingsCheck = await sql`
      SELECT COUNT(*) as count FROM ticket_classification_mapping WHERE subcategory_id = ${id}
    `

    const mappingCount = mappingsCheck.rows?.[0]?.count || 0

    if (mappingCount > 0) {
      return {
        success: false,
        error: `Cannot delete subcategory: ${mappingCount} ticket classification mapping(s) still reference this subcategory. Please delete the mappings first.`,
        dependentCount: mappingCount,
      }
    }

    await sql`DELETE FROM subcategories WHERE id = ${id}`
    return { success: true }
  } catch (error) {
    console.error("Error deleting subcategory:", error)
    return { success: false, error: "Failed to delete subcategory" }
  }
}

// Ticket Classification Mappings
export async function getTicketClassificationMappings() {
  try {
    const result = await sql`
      SELECT 
        tcm.*,
        bu.name as business_unit_group_name,
        c.name as category_name,
        s.name as subcategory_name,
        u.full_name as spoc_name
      FROM ticket_classification_mapping tcm
      JOIN business_unit_groups bu ON tcm.business_unit_group_id = bu.id
      JOIN categories c ON tcm.category_id = c.id
      JOIN subcategories s ON tcm.subcategory_id = s.id
      LEFT JOIN users u ON tcm.spoc_user_id = u.id
      ORDER BY bu.name, c.name, s.name
    `
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching ticket classification mappings:", error)
    return { success: false, error: "Failed to fetch mappings", data: [] }
  }
}

export async function createTicketClassificationMapping(
  businessUnitGroupId: number,
  categoryId: number,
  subcategoryId: number,
  estimatedDuration: number,
  spocUserId?: number,
  autoTitleTemplate?: string,
) {
  try {
    const result = await sql`
      INSERT INTO ticket_classification_mapping 
        (business_unit_group_id, category_id, subcategory_id, estimated_duration, spoc_user_id, auto_title_template)
      VALUES (${businessUnitGroupId}, ${categoryId}, ${subcategoryId}, ${estimatedDuration}, ${spocUserId || null}, ${autoTitleTemplate || null})
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to create mapping - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error creating ticket classification mapping:", error)
    return { success: false, error: "Failed to create mapping" }
  }
}

export async function updateTicketClassificationMapping(
  id: number,
  estimatedDuration: number,
  spocUserId?: number,
  autoTitleTemplate?: string,
) {
  try {
    const result = await sql`
      UPDATE ticket_classification_mapping 
      SET 
        estimated_duration = ${estimatedDuration},
        spoc_user_id = ${spocUserId || null},
        auto_title_template = ${autoTitleTemplate || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to update mapping - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error updating ticket classification mapping:", error)
    return { success: false, error: "Failed to update mapping" }
  }
}

export async function deleteTicketClassificationMapping(id: number) {
  try {
    await sql`DELETE FROM ticket_classification_mapping WHERE id = ${id}`
    return { success: true }
  } catch (error) {
    console.error("Error deleting ticket classification mapping:", error)
    return { success: false, error: "Failed to delete mapping" }
  }
}

export async function getAutoTitleTemplate(businessUnitGroupId: number, categoryId: number, subcategoryId: number | null) {
  try {
    const result = subcategoryId
      ? await sql`
          SELECT auto_title_template, estimated_duration, spoc_user_id
          FROM ticket_classification_mapping
          WHERE business_unit_group_id = ${businessUnitGroupId}
            AND category_id = ${categoryId}
            AND subcategory_id = ${subcategoryId}
        `
      : await sql`
          SELECT auto_title_template, estimated_duration, spoc_user_id
          FROM ticket_classification_mapping
          WHERE business_unit_group_id = ${businessUnitGroupId}
            AND category_id = ${categoryId}
          LIMIT 1
        `
    return { success: true, data: result && result.length > 0 ? result[0] : null }
  } catch (error) {
    console.error("Error fetching auto title template:", error)
    return { success: false, error: "Failed to fetch template" }
  }
}

// Bulk upload functions
export async function bulkUploadBusinessUnitGroups(data: Array<{ name: string; description?: string }>) {
  try {
    const results = []
    for (const item of data) {
      const result = await sql`
        INSERT INTO business_unit_groups (name, description)
        VALUES (${item.name}, ${item.description || null})
        ON CONFLICT (name) DO UPDATE SET description = ${item.description || null}
        RETURNING *
      `
      results.push(result[0])
    }
    return { success: true, data: results, count: results.length }
  } catch (error) {
    console.error("Error bulk uploading business unit groups:", error)
    return { success: false, error: "Failed to bulk upload business unit groups" }
  }
}

export async function bulkUploadCategories(data: Array<{ name: string; description?: string }>) {
  try {
    const results = []
    for (const item of data) {
      const result = await sql`
        INSERT INTO categories (name, description)
        VALUES (${item.name}, ${item.description || null})
        ON CONFLICT (name) DO UPDATE SET description = ${item.description || null}
        RETURNING *
      `
      results.push(result[0])
    }
    return { success: true, data: results, count: results.length }
  } catch (error) {
    console.error("Error bulk uploading categories:", error)
    return { success: false, error: "Failed to bulk upload categories" }
  }
}

export async function bulkUploadTicketClassificationMappings(
  data: Array<{
    businessUnitGroup: string
    category: string
    subcategory: string
    estimatedDuration: number
    spocEmail?: string
    autoTitleTemplate?: string
  }>,
) {
  try {
    const results = []
    for (const item of data) {
      // Get IDs from names
      const buResult = await sql`SELECT id FROM business_unit_groups WHERE name = ${item.businessUnitGroup}`
      const catResult = await sql`SELECT id FROM categories WHERE name = ${item.category}`
      const subcatResult = await sql`
        SELECT id FROM subcategories 
        WHERE name = ${item.subcategory} 
          AND category_id = ${catResult.rows[0]?.id}
      `

      let spocUserId = null
      if (item.spocEmail) {
        const spocResult = await sql`SELECT id FROM users WHERE email = ${item.spocEmail}`
        spocUserId = spocResult.rows[0]?.id
      }

      if (buResult.rows[0] && catResult.rows[0] && subcatResult.rows[0]) {
        const result = await sql`
          INSERT INTO ticket_classification_mapping 
            (business_unit_group_id, category_id, subcategory_id, estimated_duration, spoc_user_id, auto_title_template)
          VALUES (${buResult.rows[0].id}, ${catResult.rows[0].id}, ${subcatResult.rows[0].id}, ${item.estimatedDuration}, ${spocUserId}, ${item.autoTitleTemplate || null})
          ON CONFLICT (business_unit_group_id, category_id, subcategory_id) 
          DO UPDATE SET 
            estimated_duration = ${item.estimatedDuration},
            spoc_user_id = ${spocUserId},
            auto_title_template = ${item.autoTitleTemplate || null}
          RETURNING *
        `
        results.push(result[0])
      }
    }
    return { success: true, data: results, count: results.length }
  } catch (error) {
    console.error("Error bulk uploading ticket classification mappings:", error)
    return { success: false, error: "Failed to bulk upload mappings" }
  }
}

// Projects
export async function getProjects(businessUnitGroupId?: number) {
  try {
    const result = businessUnitGroupId
      ? await sql`
          SELECT * FROM projects
          WHERE business_unit_group_id = ${businessUnitGroupId} AND is_active = TRUE
          ORDER BY name ASC
        `
      : await sql`
          SELECT * FROM projects
          WHERE is_active = TRUE
          ORDER BY name ASC
        `
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching projects:", error)
    return { success: false, error: "Failed to fetch projects", data: [] }
  }
}

// Project Names (for release planning)
export async function getProjectNames() {
  try {
    const result = await sql`
      SELECT * FROM projects
      ORDER BY name ASC
    `
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching project names:", error)
    return { success: false, error: "Failed to fetch project names", data: [] }
  }
}

export async function createProjectName(name: string, estimatedReleaseDate?: string) {
  try {
    const trimmedName = name.trim()
    const result = await sql`
      INSERT INTO projects (name, estimated_release_date)
      VALUES (${trimmedName}, ${estimatedReleaseDate || null})
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to create project - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error: any) {
    if (error.message?.includes("duplicate key") || error.detail?.includes("already exists")) {
      return { success: false, error: `Project with this name already exists`, isDuplicate: true }
    }
    console.error("Error creating project:", error)
    return { success: false, error: "Failed to create project" }
  }
}

export async function updateProjectName(id: number, name: string, estimatedReleaseDate?: string) {
  try {
    const trimmedName = name.trim()
    const result = await sql`
      UPDATE projects
      SET name = ${trimmedName}, estimated_release_date = ${estimatedReleaseDate || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to update project - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error: any) {
    if (error.message?.includes("duplicate key") || error.detail?.includes("already exists")) {
      return { success: false, error: `Project with this name already exists`, isDuplicate: true }
    }
    console.error("Error updating project:", error)
    return { success: false, error: "Failed to update project" }
  }
}

export async function deleteProjectName(id: number) {
  try {
    await sql`DELETE FROM projects WHERE id = ${id}`
    return { success: true }
  } catch (error) {
    console.error("Error deleting project:", error)
    return { success: false, error: "Failed to delete project" }
  }
}

// Product Releases
export async function getProductReleases() {
  try {
    const result = await sql`
      SELECT
        id,
        product_name,
        package_name,
        release_number,
        release_date,
        CONCAT(product_name, ' ', release_number,
               CASE WHEN release_date IS NOT NULL
                    THEN CONCAT(' (', TO_CHAR(release_date, 'DD Mon YYYY'), ')')
                    ELSE ''
               END) as display_name
      FROM product_releases
      WHERE is_active = TRUE
      ORDER BY product_name, release_date DESC
    `
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching product releases:", error)
    return { success: false, error: "Failed to fetch product releases", data: [] }
  }
}
