## Webstorm
To debug tests in Webstorm faster without 
compiling `ts` files to `js` you can use 
`ts-node` package:

   ### Mocha:
- Install `ts-node`:
    -   `npm install --save-dev ts-node`
- Configure `Mocha` run configuration `Extra Mocha options`:
    - `--require ts-node/register --extensions ts,tsx`
- Set `Mocha` run configuration `Environment variables`:
    ```
    TS_NODE_TRANSPILE_ONLY=true
    MOCHA_THROW_DEPRECATION=false
    ```
- Run and be happy!