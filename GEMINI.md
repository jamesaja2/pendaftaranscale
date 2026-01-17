> You are a senior full-stack engineer.
> I already have a working ticketing website with UI and payment gateway integration (QRIS via YoGateway).
> I want to **refactor and extend** it into a **competition bazaar registration platform** with the following requirements:

#### 1. Registration Flow

* Participants register as a **team/tenant**
* Registration form includes:

  * Team name
  * Leader & member biodata
  * Contact info
  * Category selection:

    * `Jasa`
    * `Barang`
    * `FnB`

#### 2. Category Logic

* If category = **Jasa** or **Barang**

  * User can proceed directly to payment
* If category = **FnB**

  * Show an additional field: **Main Ingredients Selection**
  * This field must be:

    * A searchable dropdown / autocomplete
    * Pre-filled with many ingredient options (seeded from database)
    * Each team can select **maximum 2 ingredients**
    * **Each ingredient can only be used by ONE team globally**

      * Once selected by a team, it becomes unavailable for others
      * Must be enforced at database + transaction level (race-condition safe)

#### 3. Payment

* Payment via **QRIS YoGateway**
* Registration status:

  * `pending`
  * `paid`
  * `verified`
* Only paid users can access dashboard

#### 4. Additional Registration Fields

* Upload tenant image/logo
* Tenant location selection:

  * Dropdown of numbered booth locations
  * Each location can only be selected once
  * Location availability must be dynamically updated

#### 5. Participant Dashboard

After successful payment, participants can access a dashboard containing:

1. POS Account Credentials

   * Username & password
   * Credentials are manually input by admin
2. Business Model Canvas (BMC)

   * File upload
   * Has a due date
   * Late submission should be flagged
3. Guidebook

   * Downloadable file
4. Booth Layout / Denah

   * Uploaded by admin after finalization
5. Promotional Materials Submission

   * Video upload
   * Poster upload
6. Inventory Checklist Submission

   * File upload
7. Future extensible modules (`etc`)

#### 6. Admin Panel

Admin must be able to:

* CRUD users & teams
* Edit all participant data
* Upload & manage:

  * Guidebook
  * Denah
  * Due dates
* Input POS credentials per team
* Lock/unlock ingredients
* View payment & submission status
* Manage booth locations
* Toggle visibility of dashboard modules

#### 7. Technical Expectations

* Use role-based access control (`admin`, `participant`)
* All uploads stored securely
* Validation on both frontend & backend
* Database schema must prevent:

  * Duplicate ingredient usage
  * Duplicate booth location usage
* Code should be modular and scalable
* Use clean architecture and meaningful naming
