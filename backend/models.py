from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, JSON, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Job(Base):
    __tablename__ = 'jobs'

    id = Column(String(36), primary_key=True)
    status = Column(String(20), nullable=False, default='processing')
    mode = Column(String(20), nullable=False)
    style = Column(String(100), nullable=False)
    ai_intensity = Column(Float, nullable=False, default=0.5)
    num_renders = Column(Integer, nullable=False, default=1)
    high_quality = Column(Boolean, nullable=False, default=False)
    private_render = Column(Boolean, nullable=False, default=False)
    advanced_mode = Column(Boolean, nullable=False, default=False)
    model_selection = Column(String(50), nullable=False, default='adirik')
    model_name = Column(String(100))
    model_cost = Column(String(20))
    prediction_id = Column(String(100))
    model_version = Column(String(100))
    prompt = Column(Text)
    negative_prompt = Column(Text)
    result_url = Column(String(500))
    error = Column(Text)
    room_type = Column(String(50))
    room_dimensions = Column(JSON)
    spatial_layout = Column(JSON)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'status': self.status,
            'mode': self.mode,
            'style': self.style,
            'ai_intensity': self.ai_intensity,
            'num_renders': self.num_renders,
            'high_quality': self.high_quality,
            'private_render': self.private_render,
            'advanced_mode': self.advanced_mode,
            'model': {
                'id': self.model_selection,
                'name': self.model_name,
                'cost_per_generation': self.model_cost
            },
            'prediction_id': self.prediction_id,
            'model_version': self.model_version,
            'prompt': self.prompt,
            'negative_prompt': self.negative_prompt,
            'result_url': self.result_url,
            'error': self.error,
            'room_type': self.room_type,
            'room_dimensions': self.room_dimensions,
            'spatial_layout': self.spatial_layout,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 