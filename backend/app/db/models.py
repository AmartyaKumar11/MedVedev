import uuid

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy import DateTime, Float, ForeignKey, String, func, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class DoctorEmbedding(Base):
    __tablename__ = "doctor_embeddings"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("doctors.id"), nullable=False, index=True)
    embedding: Mapped[list[float]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    doctor: Mapped["Doctor"] = relationship("Doctor")


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("doctors.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    doctor: Mapped["Doctor"] = relationship("Doctor")


class SessionModel(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("doctors.id"), nullable=False, index=True)
    patient_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    doctor: Mapped["Doctor"] = relationship("Doctor")
    patient: Mapped["Patient"] = relationship("Patient")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True)
    conversation_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    soap_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    pdf_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session: Mapped["SessionModel"] = relationship("SessionModel")

