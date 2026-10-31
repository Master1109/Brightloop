export default {devIndicators:false,async rewrites(){return [{source:'/backend/:path*',destination:'http://127.0.0.1:4000/:path*'}]}};
