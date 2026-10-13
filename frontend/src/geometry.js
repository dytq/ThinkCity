let mapRef = null
let ctxRef = null

function initGeometry({ map, ctx }) {
  mapRef = map
  ctxRef = ctx
}


function cp(p){ return mapRef.latLngToContainerPoint(L.latLng(p.lat, p.lng)) }

function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y) }

function metersToPixels(m, lat){
  const zoom = mapRef.getZoom()
  const mpp = 156543.03392 * Math.cos(lat*Math.PI/180) / Math.pow(2, zoom)
  return m / mpp
}

function pathFromPoints(pts){
  ctxRef.beginPath()
  ctxRef.moveTo(pts[0].x, pts[0].y)
  for(let i=1;i<pts.length;i++) ctxRef.lineTo(pts[i].x, pts[i].y)
}

/* Spline de Catmull-Rom (équivalente à des Bézier cubiques bout à bout) */
function catmullRomSpline(pts, segmentsPerPiece, closed){
  const n = pts.length
  if(n < 3) return pts.slice()
  const at = (i)=>{
    if(closed) return pts[(i + n) % n]
    return pts[Math.max(0, Math.min(n - 1, i))]
  } 
  const out = []
  const last = closed ? n : n - 1
  for(let i = 0; i < last; i++){
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    for(let s = 0; s < segmentsPerPiece; s++){
      const t = s / segmentsPerPiece
      const t2 = t*t, t3 = t2*t
      const x = 0.5*((2*p1.x) + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3)
      const y = 0.5*((2*p1.y) + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
      out.push({x, y})
    }
  }
  out.push(closed ? at(0) : pts[n-1])
  return out
}

function smoothIfNeeded(e, pts, closed){
  if(e.smooth && pts.length > 2) return catmullRomSpline(pts, 12, !!closed)
  return pts
}

function walkPath(pts, step, cb){
  let d = 0, next = step/2
  for(let i=0;i<pts.length-1;i++){
    const a = pts[i], b = pts[i+1]
    const segLen = Math.hypot(b.x-a.x, b.y-a.y)
    while(next <= d+segLen){
      const t = (next-d)/segLen
      const x = a.x+(b.x-a.x)*t, y = a.y+(b.y-a.y)*t
      cb({x,y}, Math.atan2(b.y-a.y, b.x-a.x))
      next += step
    }
    d += segLen
  }
}

function distToSegment(p,a,b){
  const l2 = (b.x-a.x)**2+(b.y-a.y)**2
  if(l2===0) return dist(p,a)
  let t = ((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/l2
  t = Math.max(0, Math.min(1,t))
  return dist(p, {x:a.x+t*(b.x-a.x), y:a.y+t*(b.y-a.y)})
}

function minDistToSegments(pts, p, closed){
  let m = Infinity
  const n = pts.length - (closed?0:1)
  for(let i=0;i<n;i++) m = Math.min(m, distToSegment(p, pts[i], pts[(i+1)%pts.length]))
  return m
}

function offsetPolyline(pts, offset){
  const n = pts.length
  const out = []
  for(let i=0;i<n;i++){
    let dx=0, dy=0
    if(i>0){ dx += pts[i].x-pts[i-1].x; dy += pts[i].y-pts[i-1].y }
    if(i<n-1){ dx += pts[i+1].x-pts[i].x; dy += pts[i+1].y-pts[i].y }
    const len = Math.hypot(dx,dy) || 1
    const nx = -dy/len, ny = dx/len
    out.push({x: pts[i].x + nx*offset, y: pts[i].y + ny*offset})
  }
  return out
}

function pointInPolygon(p, pts){
  let inside = false
  for(let i=0, j=pts.length-1; i<pts.length; j=i++){
    const xi=pts[i].x, yi=pts[i].y, xj=pts[j].x, yj=pts[j].y
    const intersect = ((yi>p.y)!==(yj>p.y)) && (p.x < (xj-xi)*(p.y-yi)/(yj-yi)+xi)
    if(intersect) inside = !inside
  }
  return inside
}

function offsetLatLng(base, dxMeters, dyMeters){
  const R = 6378137
  const dLat = (dyMeters / R) * (180/Math.PI)
  const dLng = (dxMeters / (R*Math.cos(base.lat*Math.PI/180))) * (180/Math.PI)
  return {lat: base.lat + dLat, lng: base.lng + dLng}
}

function circleLatLng(center, radiusMeters, segments){
  const coords = []
  for(let i=0; i<=segments; i++){
    const a = (i/segments) * Math.PI * 2
    coords.push(offsetLatLng(center, radiusMeters*Math.cos(a), radiusMeters*Math.sin(a)))
  }
  return coords
}

function makeSquareIsland(center, dirDeg, distance, size){
  const rad = dirDeg*Math.PI/180
  const ux = Math.cos(rad), uy = Math.sin(rad)
  const px = -uy, py = ux
  const islandCenter = offsetLatLng(center, ux*distance, uy*distance)
  const half = size/2
  return [
    offsetLatLng(islandCenter, -ux*half - px*half, -uy*half - py*half),
    offsetLatLng(islandCenter,  ux*half - px*half,  uy*half - py*half),
    offsetLatLng(islandCenter,  ux*half + px*half,  uy*half + py*half),
    offsetLatLng(islandCenter, -ux*half + px*half, -uy*half + py*half)
  ]
}

function makeCrossing(center, dirDeg, distance, span){
  const rad = dirDeg*Math.PI/180
  const ux = Math.cos(rad), uy = Math.sin(rad)
  const px = -uy, py = ux
  const c = offsetLatLng(center, ux*distance, uy*distance)
  return [
    offsetLatLng(c,  px*span/2,  py*span/2),
    offsetLatLng(c, -px*span/2, -py*span/2)
  ]
}

export {
  initGeometry,
  cp,
  dist,
  metersToPixels,
  pathFromPoints,
  catmullRomSpline,
  smoothIfNeeded,
  walkPath,
  distToSegment,
  minDistToSegments,
  offsetPolyline,
  pointInPolygon,
  offsetLatLng,
  circleLatLng,
  makeSquareIsland,
  makeCrossing
};