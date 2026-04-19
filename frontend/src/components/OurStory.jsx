import "./OurStory.css";

export default function OurStory() {
  return (
    <div className="story">
      <div className="container story-inner">
        <div className="story-image-col">
          <div className="story-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80"
              alt="Coffee roasting process"
            />
          </div>
          <div className="story-img-accent">
            <img
              src="https://res.cloudinary.com/dovzuavd7/image/upload/v1776609183/logo_y3g7bv.png"
              alt="Coffee beans close up"
            />
          </div>
        </div>

        <div className="story-text-col">
          <p className="section-label">Our Story</p>
          <h2 className="story-heading">
            The number that
            <br />
            <em>changed everything.</em>
          </h2>
          <p className="story-body">
            65° Celsius. The precise temperature at which coffee reveals its
            full character — not scorched, not timid. Just perfect. That number
            became our obsession, and our name.
          </p>
          <p className="story-body">
            Founded in Nairobi, we believe great coffee should start at home.
            Kenya sits at the heart of the world's finest growing regions, and
            we work directly with smallholder farmers across East Africa and
            beyond — building relationships that put quality first at every
            level.
          </p>
          <div className="story-values">
            <div className="story-value">
              <div className="value-icon">⌀</div>
              <div>
                <h4>Direct Trade</h4>
                <p>We know our farmers by name.</p>
              </div>
            </div>
            <div className="story-value">
              <div className="value-icon">◈</div>
              <div>
                <h4>Roasted Fresh</h4>
                <p>Every batch roasted to order, never stale.</p>
              </div>
            </div>
            <div className="story-value">
              <div className="value-icon">◎</div>
              <div>
                <h4>Free Delivery</h4>
                <p>Across Kenya & beyond, within 48 hours.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
