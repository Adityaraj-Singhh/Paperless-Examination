require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

module.exports = {
  default: {
    datasource: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:654321@localhost:5432/paperless_examination',
    },
  },
};
