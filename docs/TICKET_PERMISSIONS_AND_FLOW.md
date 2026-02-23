# Ticket Portal - Permissions & Flow Diagrams

## Table of Contents
1. [Ticket Creation Flow](#ticket-creation-flow)
2. [Ticket Differentiation](#ticket-differentiation)
3. [Permission Matrix](#permission-matrix)
4. [Status Change Flow](#status-change-flow)
5. [Role-Based Access Control](#role-based-access-control)

---

## Ticket Creation Flow

```mermaid
flowchart TD
    Start([User Starts Creating Ticket]) --> CheckAuth{User Authenticated?}
    CheckAuth -->|No| AuthError[Redirect to Login]
    CheckAuth -->|Yes| SelectType{Select Ticket Type}
    
    SelectType -->|Support| SupportFlow[Support Ticket Flow]
    SelectType -->|Requirement| RequirementFlow[Requirement Ticket Flow]
    
    SupportFlow --> SelectTargetBG[Select Target Business Group]
    SelectTargetBG --> GetSPOC[Auto-fetch SPOC for Target BG]
    GetSPOC --> SelectCategory[Select Category]
    SelectCategory --> SelectSubcategory[Select Subcategory]
    SelectSubcategory --> FillDescription[Fill Description]
    FillDescription --> SubmitSupport[Submit Ticket]
    
    RequirementFlow --> SelectTargetBG2[Select Target Business Group]
    SelectTargetBG2 --> GetSPOC2[Auto-fetch SPOC for Target BG]
    GetSPOC2 --> FillTitle[Fill Title]
    FillTitle --> FillDescription2[Fill Description]
    FillDescription2 --> SelectProject{Select Project?}
    SelectProject -->|Yes| SelectProjectName[Select Project Name]
    SelectProject -->|No| SubmitRequirement
    SelectProjectName --> SubmitRequirement[Submit Ticket]
    
    SubmitSupport --> CheckInternal{User has business_unit_group_id?}
    SubmitRequirement --> CheckInternal
    
    CheckInternal -->|Yes| InternalTicket[Mark as Internal Ticket<br/>Set initiator_group from user's business_unit_group]
    CheckInternal -->|No| CustomerTicket[Mark as Customer Ticket<br/>initiator_group = null]
    
    InternalTicket --> CreateTicket[Create Ticket in Database]
    CustomerTicket --> CreateTicket
    
    CreateTicket --> SetAssigneeGroup{Assignee Selected?}
    SetAssigneeGroup -->|Yes| GetAssigneeGroup[Get Assignee's business_unit_group_id<br/>Set assignee_group_id]
    SetAssigneeGroup -->|No| LogCreation
    GetAssigneeGroup --> LogCreation[Log to Audit Trail]
    
    LogCreation --> SendEmail[Send Email to SPOC]
    SendEmail --> Success([Ticket Created Successfully])
    
    style Start fill:#e1f5ff
    style Success fill:#c8e6c9
    style AuthError fill:#ffcdd2
    style InternalTicket fill:#fff9c4
    style CustomerTicket fill:#fff9c4
```

---

## Ticket Differentiation

### 1. Internal vs Customer Tickets

```mermaid
flowchart LR
    User[User Creating Ticket] --> CheckGroup{User has<br/>business_unit_group_id?}
    
    CheckGroup -->|Yes<br/>User belongs to Business Unit| Internal[INTERNAL TICKET]
    CheckGroup -->|No<br/>External Customer| Customer[CUSTOMER TICKET]
    
    Internal --> InternalProps[Properties:<br/>- initiator_group = User's Business Unit<br/>- is_internal = true<br/>- creator_business_unit_group_id = User's Group ID]
    
    Customer --> CustomerProps[Properties:<br/>- initiator_group = null<br/>- is_internal = false<br/>- creator_business_unit_group_id = null]
    
    style Internal fill:#c8e6c9
    style Customer fill:#ffccbc
    style InternalProps fill:#e8f5e9
    style CustomerProps fill:#ffe0b2
```

### 2. Support vs Requirement Tickets

```mermaid
flowchart TD
    TicketType{Ticket Type?} --> Support[SUPPORT TICKET]
    TicketType --> Requirement[REQUIREMENT TICKET]
    
    Support --> SupportFields[Required Fields:<br/>- Target Business Group<br/>- Category<br/>- Subcategory<br/>- Description<br/>- SPOC]
    
    Requirement --> RequirementFields[Required Fields:<br/>- Target Business Group<br/>- Title<br/>- Description<br/>- SPOC<br/>- Project Optional]
    
    SupportFields --> SupportFeatures[Features:<br/>- Auto Title from Template<br/>- Estimated Duration<br/>- Classification Mapping]
    
    RequirementFeatures --> RequirementFeatures[Features:<br/>- Custom Title<br/>- Project Assignment<br/>- Estimated Release Date]
    
    style Support fill:#bbdefb
    style Requirement fill:#f8bbd0
```

### 3. Complete Ticket Classification Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    TICKET CLASSIFICATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dimension 1: Internal vs Customer                             │
│  ┌─────────────────┬────────────────────────────────────────┐ │
│  │ Internal Ticket │ Customer Ticket                        │ │
│  ├─────────────────┼────────────────────────────────────────┤ │
│  │ • User has      │ • User has NO                          │ │
│  │   business_unit │   business_unit_group_id                │ │
│  │   _group_id     │ • External customer                     │ │
│  │ • Created by    │ • No initiator group                   │ │
│  │   internal user │ • is_internal = false                   │ │
│  │ • Has initiator │                                         │ │
│  │   group         │                                         │ │
│  │ • is_internal = │                                         │ │
│  │   true          │                                         │ │
│  └─────────────────┴────────────────────────────────────────┘ │
│                                                                 │
│  Dimension 2: Support vs Requirement                          │
│  ┌─────────────────┬────────────────────────────────────────┐ │
│  │ Support Ticket  │ Requirement Ticket                     │ │
│  ├─────────────────┼────────────────────────────────────────┤ │
│  │ • Category      │ • Title (required)                     │ │
│  │ • Subcategory   │ • Project (optional)                   │ │
│  │ • Description   │ • Estimated Release Date               │ │
│  │ • Auto Title    │ • Custom Title                         │ │
│  │   Template      │ • No Category/Subcategory              │ │
│  │ • Estimated     │                                         │ │
│  │   Duration      │                                         │ │
│  └─────────────────┴────────────────────────────────────────┘ │
│                                                                 │
│  Possible Combinations:                                       │
│  1. Internal Support Ticket                                    │
│  2. Internal Requirement Ticket                                │
│  3. Customer Support Ticket                                    │
│  4. Customer Requirement Ticket                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Permission Matrix

### Complete Permission Matrix Table

| Action | Admin | Initiator | SPOC | Assignee |
|--------|-------|-----------|------|----------|
| **Ticket Creation** | ✅ | ✅ | ✅ | ✅ |
| **Edit Title** | ✅ | ✅ | ❌ | ❌ |
| **Edit Description** | ✅ | ✅ | ❌ | ❌ |
| **Change Status to On-Hold** | ✅ | ❌ | ✅ | ❌ |
| **Change Status to Resolved** | ✅ | ❌ | ❌ | ✅ |
| **Change Status to Closed** | ✅ | ✅ | ❌ | ❌ |
| **Change Status to Deleted** | ✅ | ✅ | ❌ | ❌ |
| **Reopen Resolved/Closed** | ✅ | ✅ | ❌ | ✅ |
| **Assign/Reassign Assignee** | ✅ | ❌ | ✅ | ❌ |
| **Select Project** | ✅ | ❌ | ✅ | ❌ |
| **Redirect Ticket** | ✅ | ❌ | ✅ | ❌ |
| **Add Comments** | ✅ | ✅ | ✅ | ✅ |
| **Add Attachments** | ✅ | ✅ | ✅ | ✅ |
| **Delete Ticket** | ✅ | ✅ | ❌ | ❌ |
| **View Activity History** | ✅ | ✅ | ✅ | ✅ |

### Permission Flow Diagram

```mermaid
flowchart TD
    UserAction[User Attempts Action] --> CheckRole{What is User's Role?}
    
    CheckRole -->|Admin| AdminPerms[Admin Permissions:<br/>✅ All Actions Allowed]
    
    CheckRole -->|Initiator| InitiatorCheck{Action Type?}
    InitiatorCheck -->|Edit Title/Description| Allow1[✅ Allowed]
    InitiatorCheck -->|Close/Delete| Allow2[✅ Allowed with Reason/Remarks]
    InitiatorCheck -->|Reopen| Allow3[✅ Allowed if Resolved/Closed]
    InitiatorCheck -->|Status Change| CheckStatus1{Status Type?}
    CheckStatus1 -->|On-Hold/Resolved| Deny1[❌ Not Allowed]
    CheckStatus1 -->|Closed/Deleted| Allow4[✅ Allowed]
    
    CheckRole -->|SPOC| SPOCCheck{Action Type?}
    SPOCCheck -->|Assign Assignee| Allow5[✅ Allowed]
    SPOCCheck -->|Select Project| Allow6[✅ Allowed]
    SPOCCheck -->|Redirect Ticket| Allow7[✅ Allowed with Remarks]
    SPOCCheck -->|Status to On-Hold| Allow8[✅ Allowed]
    SPOCCheck -->|Status to Resolved| Deny2[❌ Not Allowed]
    SPOCCheck -->|Close/Delete| Deny3[❌ Not Allowed]
    
    CheckRole -->|Assignee| AssigneeCheck{Action Type?}
    AssigneeCheck -->|Status to Resolved| Allow9[✅ Allowed with Reason/Remarks]
    AssigneeCheck -->|Reopen Ticket| Allow10[✅ Allowed if Resolved/Closed]
    AssigneeCheck -->|Status to On-Hold| Deny4[❌ Not Allowed]
    AssigneeCheck -->|Close/Delete| Deny5[❌ Not Allowed]
    AssigneeCheck -->|Assign Assignee| Deny6[❌ Not Allowed]
    
    Allow1 --> ExecuteAction[Execute Action]
    Allow2 --> ExecuteAction
    Allow3 --> ExecuteAction
    Allow4 --> ExecuteAction
    Allow5 --> ExecuteAction
    Allow6 --> ExecuteAction
    Allow7 --> ExecuteAction
    Allow8 --> ExecuteAction
    Allow9 --> ExecuteAction
    Allow10 --> ExecuteAction
    AdminPerms --> ExecuteAction
    
    Deny1 --> Error[❌ Permission Denied]
    Deny2 --> Error
    Deny3 --> Error
    Deny4 --> Error
    Deny5 --> Error
    Deny6 --> Error
    
    style AdminPerms fill:#c8e6c9
    style ExecuteAction fill:#c8e6c9
    style Error fill:#ffcdd2
```

---

## Status Change Flow

### Status Change Permission Matrix

```mermaid
stateDiagram-v2
    [*] --> Open: Ticket Created
    
    Open --> OnHold: SPOC can change
    Open --> Resolved: Assignee can change
    Open --> Closed: Initiator can change
    Open --> Deleted: Initiator can change
    
    OnHold --> Open: SPOC can reopen
    OnHold --> Resolved: Assignee can change
    
    Resolved --> Open: Initiator/Assignee can reopen
    Resolved --> Closed: Initiator can change
    
    Closed --> Open: Initiator can reopen
    Closed --> Deleted: Initiator can change
    
    Deleted --> [*]: Final State
    
    note right of Open
        Initial State
        All roles can view
    end note
    
    note right of OnHold
        SPOC Permission:
        - Can set to On-Hold
        - Can reopen to Open
    end note
    
    note right of Resolved
        Assignee Permission:
        - Can set to Resolved
        - Can reopen to Open
    end note
    
    note right of Closed
        Initiator Permission:
        - Can close ticket
        - Can reopen to Open
    end note
    
    note right of Deleted
        Initiator Permission:
        - Can delete ticket
        - Final state
    end note
```

### Status Change with Modal Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Modal
    participant API
    participant DB
    participant Audit
    
    User->>UI: Select Status from Dropdown
    UI->>UI: Check User Role & Current Status
    UI->>UI: Filter Available Status Options
    
    alt Status Change Allowed
        UI->>Modal: Open Status Change Modal
        Modal->>User: Display: Old Status → New Status
        User->>Modal: Enter Reason (Required)
        User->>Modal: Enter Remarks (Optional)
        User->>Modal: Click Confirm
        
        Modal->>API: updateTicketStatus(ticketId, status, reason, remarks)
        API->>DB: Get Current Ticket Info
        API->>API: Validate Permissions
        API->>DB: Update Ticket Status
        API->>Audit: Log Status Change with Reason/Remarks
        API->>API: Send Email Notifications
        API->>UI: Return Success
        
        UI->>UI: Reload Ticket List
        UI->>User: Show Success Message
    else Status Change Not Allowed
        UI->>User: Show Permission Denied Error
    end
```

### Dynamic Status Options by Role

```mermaid
flowchart TD
    User[User Views Status Dropdown] --> CheckRole{User Role?}
    
    CheckRole -->|Admin| AdminOptions[All Status Options:<br/>- Open<br/>- On-Hold<br/>- Resolved<br/>- Closed<br/>- Returned<br/>- Deleted]
    
    CheckRole -->|SPOC| SPOCOptions{Current Status?}
    SPOCOptions -->|Open| SPOCFromOpen[Available:<br/>- On-Hold<br/>- Resolved]
    SPOCOptions -->|On-Hold| SPOCFromHold[Available:<br/>- Open<br/>- Resolved]
    SPOCOptions -->|Resolved| SPOCFromResolved[Available:<br/>- Open]
    
    CheckRole -->|Assignee| AssigneeOptions{Current Status?}
    AssigneeOptions -->|Open| AssigneeFromOpen[Available:<br/>- Resolved]
    AssigneeOptions -->|Resolved| AssigneeFromResolved[Available:<br/>- Open]
    
    CheckRole -->|Initiator| InitiatorOptions{Current Status?}
    InitiatorOptions -->|Open| InitiatorFromOpen[Available:<br/>- Closed<br/>- Deleted]
    InitiatorOptions -->|Resolved| InitiatorFromResolved[Available:<br/>- Open<br/>- Closed<br/>- Deleted]
    
    AdminOptions --> ShowDropdown[Show Filtered Options in Dropdown]
    SPOCFromOpen --> ShowDropdown
    SPOCFromHold --> ShowDropdown
    SPOCFromResolved --> ShowDropdown
    AssigneeFromOpen --> ShowDropdown
    AssigneeFromResolved --> ShowDropdown
    InitiatorFromOpen --> ShowDropdown
    InitiatorFromResolved --> ShowDropdown
    
    ShowDropdown --> UserSelects[User Selects Status]
    UserSelects --> OpenModal[Open Status Change Modal]
    
    style AdminOptions fill:#c8e6c9
    style ShowDropdown fill:#e1f5ff
    style OpenModal fill:#fff9c4
```

---

## Role-Based Access Control

### User Role Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ROLE HIERARCHY                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐                                           │
│  │    ADMIN     │  ← Highest Privileges                     │
│  │              │     • All Actions Allowed                  │
│  │              │     • Can Override Any Permission          │
│  └──────────────┘                                           │
│         │                                                    │
│         ├─────────────────────────────────────┐             │
│         │                                     │             │
│  ┌──────────────┐                    ┌──────────────┐      │
│  │  INITIATOR   │                    │     SPOC     │      │
│  │              │                    │              │      │
│  │ • Created    │                    │ • Assigned   │      │
│  │   the ticket │                    │   to Target │      │
│  │ • Can close  │                    │   Business  │      │
│  │   & delete   │                    │   Group      │      │
│  │ • Can edit   │                    │ • Can assign│      │
│  │   title/desc │                    │   assignee   │      │
│  │              │                    │ • Can put on │      │
│  │              │                    │   hold       │      │
│  │              │                    │ • Can redirect│     │
│  └──────────────┘                    └──────────────┘      │
│         │                                     │             │
│         └─────────────────────────────────────┘             │
│                            │                                │
│                   ┌──────────────┐                          │
│                   │  ASSIGNEE    │                          │
│                   │              │                          │
│                   │ • Assigned to│                          │
│                   │   work on    │                          │
│                   │   ticket     │                          │
│                   │ • Can resolve │                          │
│                   │ • Can reopen  │                          │
│                   └──────────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Ticket Access Control Flow

```mermaid
flowchart TD
    UserAccess[User Accesses Ticket] --> CheckAuth{Authenticated?}
    CheckAuth -->|No| RedirectLogin[Redirect to Login]
    CheckAuth -->|Yes| CheckRole{User Role?}
    
    CheckRole -->|Admin| FullAccess[Full Access:<br/>✅ View All<br/>✅ Edit All<br/>✅ Delete<br/>✅ All Status Changes]
    
    CheckRole -->|Initiator| InitiatorAccess{Is User the<br/>Ticket Creator?}
    InitiatorAccess -->|Yes| InitiatorPerms[Initiator Permissions:<br/>✅ View<br/>✅ Edit Title/Description<br/>✅ Close/Delete<br/>✅ Reopen]
    InitiatorAccess -->|No| LimitedView[Limited View:<br/>✅ View Only]
    
    CheckRole -->|SPOC| SPOCAccess{Is User the<br/>Ticket SPOC?}
    SPOCAccess -->|Yes| SPOCPerms[SPOC Permissions:<br/>✅ View<br/>✅ Assign Assignee<br/>✅ Select Project<br/>✅ Redirect<br/>✅ On-Hold Status]
    SPOCAccess -->|No| LimitedView2[Limited View:<br/>✅ View Only]
    
    CheckRole -->|Assignee| AssigneeAccess{Is User the<br/>Ticket Assignee?}
    AssigneeAccess -->|Yes| AssigneePerms[Assignee Permissions:<br/>✅ View<br/>✅ Resolve Status<br/>✅ Reopen<br/>✅ Add Comments/Attachments]
    AssigneeAccess -->|No| LimitedView3[Limited View:<br/>✅ View Only]
    
    FullAccess --> GrantAccess[Grant Access]
    InitiatorPerms --> GrantAccess
    SPOCPerms --> GrantAccess
    AssigneePerms --> GrantAccess
    LimitedView --> GrantAccess
    LimitedView2 --> GrantAccess
    LimitedView3 --> GrantAccess
    
    style FullAccess fill:#c8e6c9
    style GrantAccess fill:#c8e6c9
    style RedirectLogin fill:#ffcdd2
```

---

## Key Differentiators Summary

### 1. Internal vs Customer Tickets

**Determination Logic:**
- **Internal Ticket**: `creator_business_unit_group_id IS NOT NULL`
  - User belongs to a Business Unit Group
  - Has `initiator_group_name` (from user's business_unit_group)
  - `is_internal = true`
  
- **Customer Ticket**: `creator_business_unit_group_id IS NULL`
  - External customer (no business unit group)
  - `initiator_group_name = null`
  - `is_internal = false`

### 2. Support vs Requirement Tickets

**Support Ticket:**
- Requires: Category, Subcategory, Description
- Uses: Auto Title Template, Estimated Duration
- Classification: Based on Target Business Group mapping

**Requirement Ticket:**
- Requires: Title, Description
- Optional: Project, Estimated Release Date
- No Category/Subcategory classification

### 3. Permission Determination

**User Roles in Context:**
- **Initiator**: User who created the ticket (`created_by`)
- **SPOC**: User assigned as SPOC for the Target Business Group (`spoc_user_id`)
- **Assignee**: User assigned to work on the ticket (`assigned_to`)
- **Admin**: User with role = 'admin'

**Permission Check Flow:**
1. Check if user is Admin → Full access
2. Check if user is Initiator → Initiator permissions
3. Check if user is SPOC → SPOC permissions
4. Check if user is Assignee → Assignee permissions
5. Default → View only

---

## Status Change Rules Summary

| Current Status | SPOC Can Change To | Assignee Can Change To | Initiator Can Change To |
|----------------|-------------------|----------------------|----------------------|
| **Open** | On-Hold, Resolved | Resolved | Closed, Deleted |
| **On-Hold** | Open, Resolved | Resolved | Closed, Deleted |
| **Resolved** | Open | Open | Open, Closed, Deleted |
| **Closed** | - | - | Open, Deleted |
| **Deleted** | - | - | - |

**Note:** All status changes require Reason (mandatory) and Remarks (optional) through the Status Change Modal.

---

## Audit Trail

All actions are logged with:
- **Action Type**: created, status_change, assignment_change, project_change, redirection, comment_added
- **Old Value**: Previous state
- **New Value**: New state
- **Performed By**: User ID and Name
- **Notes**: Additional context (reason, remarks, etc.)
- **Timestamp**: When the action occurred

---

*Last Updated: Based on current codebase implementation*
