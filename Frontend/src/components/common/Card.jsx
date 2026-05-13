import PropTypes from 'prop-types';

export default function Card({ children, className = '', padding = true }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-bark-400/10 ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  padding: PropTypes.bool,
};

