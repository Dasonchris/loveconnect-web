import { useState, useEffect } from 'react';
import { marketplaceAPI } from '../api';
import './AdBanner.css';
import { useNavigate } from 'react-router-dom';

export default function AdBanner({ compact = false, limit = 3 }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await marketplaceAPI.getFeatured(limit);
        const list = data?.products || data?.products || data || [];
        if (mounted) setProducts(list.slice(0, limit));
      } catch (err) {
        console.error('Ad load failed', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [limit]);

  if (loading) return null;
  if (!products || products.length === 0) return null;

  // Choose first product for compact view
  const first = products[0];

  if (compact) {
    return (
      <div className="ad-compact" onClick={() => navigate('/marketplace')} role="link">
        <span className="ad-compact-title">{first.name}</span>
        <span className="ad-compact-price">{first.price ? `\u20B5${first.price}` : ''}</span>
      </div>
    );
  }

  return (
    <div className="ad-banner">
      {products.map((p, i) => (
        <div className="ad-item" key={p._id || i} onClick={() => navigate('/marketplace')}>
          <img src={p.image || '/placeholder-product.png'} alt={p.name} />
          <div className="ad-meta">
            <div className="ad-name">{p.name}</div>
            <div className="ad-price">{p.price ? `\u20B5${p.price}` : ''}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
