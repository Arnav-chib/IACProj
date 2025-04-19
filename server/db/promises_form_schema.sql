-- Promises Form Schema
-- This script inserts a new form for tracking political promises

-- Create the form
DECLARE @FormID INT;
DECLARE @GroupID INT;
DECLARE @CreatedBy INT = 1; -- Assuming admin user with ID 1
DECLARE @NextPosition INT = 1;

-- Insert form master
INSERT INTO FormMaster (Name, CreateDate, CreatedBy, Status)
VALUES ('Political Promises Tracker', GETDATE(), @CreatedBy, 'active');

SET @FormID = SCOPE_IDENTITY();

-- Basic Information Fields
-- Headline
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, NeedsApproval)
VALUES (@FormID, 'Headline', 'text', 1, 'active', @CreatedBy, @NextPosition, 0);
SET @NextPosition = @NextPosition + 1;

-- Verbatim
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, NeedsApproval)
VALUES (@FormID, 'Verbatim', 'text', 1, 'active', @CreatedBy, @NextPosition, 0);
SET @NextPosition = @NextPosition + 1;

-- Summary
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, NeedsApproval)
VALUES (@FormID, 'Summary', 'text', 1, 'active', @CreatedBy, @NextPosition, 0);
SET @NextPosition = @NextPosition + 1;

-- Date Of Promise
DECLARE @DateOfPromiseFieldID INT;
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, NeedsApproval)
VALUES (@FormID, 'Date Of Promise', 'date', 1, 'active', @CreatedBy, @NextPosition, 0);
SET @DateOfPromiseFieldID = SCOPE_IDENTITY();
SET @NextPosition = @NextPosition + 1;

-- Deadline fields
-- Deadline checkbox
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, NeedsApproval)
VALUES (@FormID, 'Deadline', 'checkbox', 0, 'active', @CreatedBy, @NextPosition, 0);
SET @NextPosition = @NextPosition + 1;

-- Deadline Date with validation logic to ensure it's after Date Of Promise
DECLARE @DeadlineDateFieldID INT;
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, ValidationLogic, NeedsApproval)
VALUES (@FormID, 'Deadline Date', 'date', 0, 'active', @CreatedBy, @NextPosition, 
  JSON_QUERY('{"dependsOn": ' + CAST(@DateOfPromiseFieldID AS VARCHAR) + ', "minDate": "fieldValue"}'), 0);
SET @DeadlineDateFieldID = SCOPE_IDENTITY();
SET @NextPosition = @NextPosition + 1;

-- Given By
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, NeedsApproval)
VALUES (@FormID, 'Given By', 'text', 1, 'active', @CreatedBy, @NextPosition, 0);
SET @NextPosition = @NextPosition + 1;

-- Types (dropdown)
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, PopulationLogic, NeedsApproval)
VALUES (@FormID, 'Types', 'dropdown', 1, 'active', @CreatedBy, @NextPosition, 
  JSON_QUERY('{"options": ["Disaster Promise", "Non Poll", "Others"]}'), 0);
SET @NextPosition = @NextPosition + 1;

-- Designation (dropdown)
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, PopulationLogic, NeedsApproval)
VALUES (@FormID, 'Designation', 'dropdown', 1, 'active', @CreatedBy, @NextPosition, 
  JSON_QUERY('{"options": ["Union Minister", "Minister of State (MoS)", "Minister of State (Independent Charge)", "Deputy Minister", "Chairperson", "Vice-Chairperson", "Member", "Secretary", "Joint Secretary", "Additional Secretary", "Under Secretary", "PM", "Deputy PM", "CM", "Deputy CM", "Cabinet Minister", "MoS (Independent Charge)", "MoS", "MP (Lok Sabha)"]}'), 0);
SET @NextPosition = @NextPosition + 1;

-- Ministry Government (dropdown)
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, PopulationLogic, NeedsApproval)
VALUES (@FormID, 'Ministry Government', 'dropdown', 1, 'active', @CreatedBy, @NextPosition, 
  JSON_QUERY('{"options": ["Ministry of Agriculture & Farmers Welfare", "Ministry of Ayush", "Ministry of Chemicals and Fertilizers", "Ministry of Civil Aviation", "Ministry of Coal", "Ministry of Commerce and Industry", "Ministry of Communications", "Ministry of Consumer Affairs, Food and Public Distribution", "Ministry of Corporate Affairs", "Ministry of Culture", "Ministry of Defence", "Ministry of Development of North Eastern Region", "Ministry of Earth Sciences", "Ministry of Education", "Ministry of Electronics and Information Technology", "Ministry of Environment, Forest and Climate Change", "Ministry of External Affairs", "Ministry of Finance", "Ministry of Fisheries, Animal Husbandry and Dairying"]}'), 0);
SET @NextPosition = @NextPosition + 1;

-- States (dropdown)
DECLARE @StatesFieldID INT;
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, PopulationLogic, NeedsApproval)
VALUES (@FormID, 'States', 'dropdown', 1, 'active', @CreatedBy, @NextPosition, 
  JSON_QUERY('{"options": ["Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha"]}'), 0);
SET @StatesFieldID = SCOPE_IDENTITY();
SET @NextPosition = @NextPosition + 1;

-- Constituency (dropdown with dynamic filtering based on state)
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, PopulationLogic, ValidationLogic, NeedsApproval)
VALUES (@FormID, 'Constituency', 'dropdown', 1, 'active', @CreatedBy, @NextPosition, 
  JSON_QUERY('{"dependsOn": ' + CAST(@StatesFieldID AS VARCHAR) + ', "options": {
    "Madhya Pradesh": ["Betul", "Bhind", "Bhopal", "Chhindwara", "Damoh", "Dewas", "Dhar", "Guna", "Gwalior", "Hoshangabad", "Indore", "Jabalpur", "Khajuraho", "Khandwa", "Khargone", "Mandla", "Mandsour", "Morena"], 
    "Haryana": ["Ambala", "Bhiwani", "Faridabad", "Gurgaon", "Hisar", "Karnal", "Kurukshetra", "Rohtak", "Sirsa", "Sonipat"]
  }}'), NULL, 0);
SET @NextPosition = @NextPosition + 1;

-- Party (dropdown)
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, PopulationLogic, NeedsApproval)
VALUES (@FormID, 'Party', 'dropdown', 1, 'active', @CreatedBy, @NextPosition, 
  JSON_QUERY('{"options": ["Bharatiya Janata Party (BJP)", "Indian National Congress (INC)", "Communist Party of India (CPI)", "Communist Party of India (Marxist) (CPI(M))", "Bahujan Samaj Party (BSP)", "Nationalist Congress Party (NCP)", "All India Trinamool Congress (AITC)", "National People''s Party (NPP)", "Telugu Desam Party (TDP)", "YSR Congress Party (YSRCP)", "People''s Party of Arunachal (PPA)", "Asom Gana Parishad (AGP)", "All India United Democratic Front (AIUDF)", "Janata Dal (United) (JDU)", "Rashtriya Janata Dal (RJD)", "Lok Janshakti Party (LJP)", "Janta Congress Chhattisgarh (JCC)", "Aam Aadmi Party (AAP)", "Goa Forward Party (GFP)"]}'), 0);
SET @NextPosition = @NextPosition + 1;

-- Target Audience (multiselect dropdown)
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, PopulationLogic, NeedsApproval)
VALUES (@FormID, 'Target Audience', 'dropdown', 0, 'active', @CreatedBy, @NextPosition, 
  JSON_QUERY('{"multiple": true, "options": ["Below Poverty Line (BPL)", "Schedule Caste (SC)", "Schedule Tribe (ST)", "Other Backward Classes (OBC)", "Economically Weaker Sections (EWS)", "Physically Challenged (Divyaang)", "Children"]}'), 0);
SET @NextPosition = @NextPosition + 1;

-- Fulfillment Status (slider)
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, PopulationLogic, NeedsApproval)
VALUES (@FormID, 'Fulfillment Status', 'slider', 0, 'active', @CreatedBy, @NextPosition, 
  JSON_QUERY('{"min": 0, "max": 5, "step": 1, "defaultValue": 0}'), 0);
SET @NextPosition = @NextPosition + 1;

-- Create Media Group
INSERT INTO GroupDetails (FormID, GroupID, LabelName, NumColumns, ColumnConfig, NumRows, CanAddRows)
VALUES (@FormID, 'media-group', 'Media', 3, 
  '{"columns":[{"id":"mediaLink","label":"Media Link"},{"id":"linkType","label":"Link Type"},{"id":"mediaFile","label":"Upload"}]}', 
  1, 1);

SET @GroupID = SCOPE_IDENTITY();

-- Media Link field in group
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, InGroup, NeedsApproval)
VALUES (@FormID, 'Media Link', 'text', 0, 'active', @CreatedBy, @NextPosition, @GroupID, 0);
SET @NextPosition = @NextPosition + 1;

-- Link Type dropdown in group
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, InGroup, PopulationLogic, NeedsApproval)
VALUES (@FormID, 'Link Type', 'dropdown', 0, 'active', @CreatedBy, @NextPosition, @GroupID, 
  JSON_QUERY('{"options": ["News Article", "YouTube Video", "Social Media Post", "Official Document", "Other"]}'), 0);
SET @NextPosition = @NextPosition + 1;

-- Actual Media (file upload) in group
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, InGroup, NeedsApproval)
VALUES (@FormID, 'Actual Media', 'file', 0, 'active', @CreatedBy, @NextPosition, @GroupID, 0);
SET @NextPosition = @NextPosition + 1;

-- Fulfillment Summary (rich text) with approval required
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, NeedsApproval)
VALUES (@FormID, 'Fulfillment Summary', 'richtext', 0, 'active', @CreatedBy, @NextPosition, 1);
SET @NextPosition = @NextPosition + 1;

-- Add Media (file upload) field
INSERT INTO FormDetails (FormID, FieldName, FieldType, IsMandatory, Status, CreatedBy, Position, NeedsApproval)
VALUES (@FormID, 'Add Media', 'file', 0, 'active', @CreatedBy, @NextPosition, 0);
SET @NextPosition = @NextPosition + 1;

PRINT 'Political Promises Tracker form created with ID: ' + CAST(@FormID AS VARCHAR); 