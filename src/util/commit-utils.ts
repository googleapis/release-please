export const normalizePaths = (paths: string[]) => {
  return paths.map(path => {
    // normalize so that all paths have leading and trailing slashes for
    // non-overlap validation.
    // NOTE: GitHub API always returns paths using the `/` separator,
    // regardless of what platform the client code is running on
    let newPath = path.replace(/\/$/, '');
    newPath = newPath.replace(/^\//, '');
    newPath = newPath.replace(/$/, '/');
    newPath = newPath.replace(/^/, '/');
    // store them with leading and trailing slashes removed.
    newPath = newPath.replace(/\/$/, '');
    newPath = newPath.replace(/^\//, '');
    return newPath;
  });
};
