-- Tenant Database Schema

-- Form Master Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FormMaster')
BEGIN
    CREATE TABLE FormMaster (
        ID INT PRIMARY KEY IDENTITY(1,1),
        Name NVARCHAR(100) NOT NULL,
        CreateDate DATETIME NOT NULL DEFAULT GETDATE(),
        CreatedBy INT NOT NULL,
        ModifiedBy INT NULL,
        ModifiedDate DATETIME NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'draft', -- draft/active
        CONSTRAINT CK_Status CHECK (Status IN ('draft', 'active'))
    );
END

-- Form Details Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FormDetails')
BEGIN
    CREATE TABLE FormDetails (
        ID INT PRIMARY KEY IDENTITY(1,1),
        FormID INT NOT NULL,
        FieldName NVARCHAR(100) NOT NULL,
        FieldType NVARCHAR(50) NOT NULL,
        IsMandatory BIT NOT NULL DEFAULT 0,
        Status NVARCHAR(20) NOT NULL DEFAULT 'active', -- active/inactive/removed
        CreatedBy INT NOT NULL,
        Position INT NOT NULL,
        ValidationLogic NVARCHAR(MAX) NULL,
        PopulationLogic NVARCHAR(MAX) NULL,
        InGroup INT NULL, -- References GroupDetails.ID
        NeedsApproval BIT NOT NULL DEFAULT 0,
        FOREIGN KEY (FormID) REFERENCES FormMaster(ID),
        CONSTRAINT CK_FormDetails_Status CHECK (Status IN ('active', 'inactive', 'removed'))
    );
END

-- Group Details Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroupDetails')
BEGIN
    CREATE TABLE GroupDetails (
        ID INT PRIMARY KEY IDENTITY(1,1),
        FormID INT NOT NULL,
        GroupID NVARCHAR(50) NOT NULL,
        LabelName NVARCHAR(100) NOT NULL,
        NumColumns INT NOT NULL DEFAULT 1,
        ColumnConfig NVARCHAR(MAX) NOT NULL, -- JSON with column configurations
        NumRows INT NOT NULL DEFAULT 1,
        CanAddRows BIT NOT NULL DEFAULT 0,
        FOREIGN KEY (FormID) REFERENCES FormMaster(ID)
    );
END

-- Form Responses Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FormResponses')
BEGIN
    CREATE TABLE FormResponses (
        ResponseID INT PRIMARY KEY IDENTITY(1,1),
        FormID INT NOT NULL,
        RespondentInfo NVARCHAR(MAX) NULL, -- Information about respondent (optional)
        SubmittedAt DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (FormID) REFERENCES FormMaster(ID)
    );
END

-- Response Details Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ResponseDetails')
BEGIN
    CREATE TABLE ResponseDetails (
        ID INT PRIMARY KEY IDENTITY(1,1),
        ResponseID INT NOT NULL,
        FieldID INT NOT NULL,
        Value NVARCHAR(MAX) NULL,
        IsApproved BIT NOT NULL DEFAULT 0,
        FOREIGN KEY (ResponseID) REFERENCES FormResponses(ResponseID),
        FOREIGN KEY (FieldID) REFERENCES FormDetails(ID)
    );
END

-- Create optimized indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FormDetails_FormID')
    CREATE NONCLUSTERED INDEX IX_FormDetails_FormID ON FormDetails(FormID, Position);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FormDetails_Status')
    CREATE NONCLUSTERED INDEX IX_FormDetails_Status ON FormDetails(Status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GroupDetails_FormID')
    CREATE NONCLUSTERED INDEX IX_GroupDetails_FormID ON GroupDetails(FormID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ResponseDetails_ResponseID')
    CREATE NONCLUSTERED INDEX IX_ResponseDetails_ResponseID ON ResponseDetails(ResponseID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FormResponses_FormID')
    CREATE NONCLUSTERED INDEX IX_FormResponses_FormID ON FormResponses(FormID);
