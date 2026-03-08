import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '@/lib/db';

const PageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    db('page_views').insert({ page: location.pathname }).then(() => {});
  }, [location.pathname]);

  return null;
};

export default PageViewTracker;
