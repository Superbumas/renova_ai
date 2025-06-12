from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from models import Base, Job
import logging

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self, db_url):
        self.engine = create_engine(db_url)
        self.Session = sessionmaker(bind=self.engine)
        self._init_db()

    def _init_db(self):
        """Initialize database tables"""
        try:
            Base.metadata.create_all(self.engine)
            logger.info("Database tables initialized successfully")
        except SQLAlchemyError as e:
            logger.error(f"Error initializing database: {str(e)}")
            raise

    def create_job(self, job_data):
        """Create a new job"""
        session = self.Session()
        try:
            job = Job(**job_data)
            session.add(job)
            session.commit()
            session.refresh(job)
            return job
        except SQLAlchemyError as e:
            logger.error(f"Error creating job: {str(e)}")
            session.rollback()
            return None
        finally:
            session.close()

    def get_job(self, job_id):
        """Get a job by ID"""
        session = self.Session()
        try:
            job = session.query(Job).filter_by(id=job_id).first()
            return job
        except SQLAlchemyError as e:
            logger.error(f"Error getting job {job_id}: {str(e)}")
            return None
        finally:
            session.close()

    def update_job(self, job_id, update_data):
        """Update a job"""
        session = self.Session()
        try:
            job = session.query(Job).filter_by(id=job_id).first()
            if not job:
                return None
            
            for key, value in update_data.items():
                setattr(job, key, value)
            
            session.commit()
            session.refresh(job)
            return job
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error updating job {job_id}: {str(e)}")
            return None
        finally:
            session.close()

    def list_jobs(self):
        """List all jobs"""
        session = self.Session()
        try:
            jobs = session.query(Job).all()
            return jobs
        except SQLAlchemyError as e:
            logger.error(f"Error listing jobs: {str(e)}")
            return []
        finally:
            session.close()

    def delete_job(self, job_id):
        """Delete a job"""
        session = self.Session()
        try:
            job = session.query(Job).filter_by(id=job_id).first()
            if job:
                session.delete(job)
                session.commit()
                return True
            return False
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error deleting job {job_id}: {str(e)}")
            return False
        finally:
            session.close() 