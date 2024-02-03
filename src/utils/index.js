const mapDBToSongs = ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  albumid,
}) => ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  albumid,
});

const mapDBToAlbums = ({
  id,
  name,
  year,
}) => ({
  id,
  name,
  year,
});

const mapDBToUsers = ({
  id,
  username,
  password,
  fullname,
}) => ({
  id,
  username,
  password,
  fullname,
});

module.exports = {
  mapDBToSongs,
  mapDBToAlbums,
  mapDBToUsers,
};
