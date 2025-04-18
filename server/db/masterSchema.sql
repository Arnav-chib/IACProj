-- Master Database Schema

-- Organizations Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Organizations')
BEGIN
    CREATE TABLE Organizations (
        OrgID INT PRIMARY KEY IDENTITY(1,1),
        OrgName NVARCHAR(100) NOT NULL,
        SubscriptionStatus NVARCHAR(20) NOT NULL DEFAULT 'active',
        DBConnectionString NVARCHAR(MAX) NOT NULL,
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE()
    );
END

-- Users Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        UserID INT PRIMARY KEY IDENTITY(1,1),
        Username NVARCHAR(50) NOT NULL,
        Email NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(200) NOT NULL,
        OrgID INT NULL,  -- NULL means individual user with own DB
        IsOrgAdmin BIT NOT NULL DEFAULT 0,
        DBConnectionString NVARCHAR(MAX) NULL, -- Only populated for individual users
        SubscriptionStatus NVARCHAR(20) NULL,  -- Only used for individual users
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
        ResetPasswordToken NVARCHAR(200) NULL,
        ResetPasswordExpires DATETIME NULL,
        FOREIGN KEY (OrgID) REFERENCES Organizations(OrgID)
    );
END

-- API Tokens Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'API_Tokens')
BEGIN
    CREATE TABLE API_Tokens (
        TokenID INT PRIMARY KEY IDENTITY(1,1),
        UserID INT NOT NULL,
        TokenHash NVARCHAR(100) NOT NULL,
        TokenName NVARCHAR(50) NOT NULL,
        Permissions NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        ExpiresAt DATETIME NOT NULL,
        LastUsed DATETIME NULL,
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
    );
END

-- Form Mapping Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FormMapping')
BEGIN
    CREATE TABLE FormMapping (
        MappingID INT PRIMARY KEY IDENTITY(1,1),
        FormID NVARCHAR(50) NOT NULL UNIQUE,
        UserID INT NOT NULL,
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
    );
END

-- Create indexes for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email')
    CREATE INDEX IX_Users_Email ON Users(Email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_API_Tokens_TokenHash')
    CREATE INDEX IX_API_Tokens_TokenHash ON API_Tokens(TokenHash);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FormMapping_FormID')
    CREATE INDEX IX_FormMapping_FormID ON FormMapping(FormID);
