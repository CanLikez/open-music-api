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

const mapDBToActivities = ({
  username,
  title,
  action,
  time,
}) => ({
  username,
  title,
  action,
  time,
});

module.exports = {
  mapDBToSongs,
  mapDBToAlbums,
  mapDBToUsers,
  mapDBToActivities,
};
