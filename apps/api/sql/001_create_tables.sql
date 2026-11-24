
-- MediCore Hospital Management Database
-- Initial schema

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    head VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    staff_count INTEGER NOT NULL DEFAULT 0
        CHECK (staff_count >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    specialisation VARCHAR(100) NOT NULL,
    department_id UUID NOT NULL
        REFERENCES departments(id) ON DELETE RESTRICT,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Available'
        CHECK (status IN ('Available', 'Unavailable')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    age INTEGER NOT NULL
        CHECK (age BETWEEN 0 AND 130),
    gender VARCHAR(30) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL
        REFERENCES doctors(id) ON DELETE RESTRICT,
    appointment_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled'
        CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_department
    ON doctors(department_id);

CREATE INDEX IF NOT EXISTS idx_appointments_patient
    ON appointments(patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
    ON appointments(doctor_id, appointment_date);
