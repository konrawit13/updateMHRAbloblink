function reqBin3() {
  /**
   * This is the main function to request and set MHRA bloblinks including: detail as per headers into target SSID
   * @params {*} - ssid
   */
  function setRequest(ssid) {
    let ss = SpreadsheetApp.openById(ssid);

    const sheet = ss.insertSheet("main");
    const loopcount = 3000;
    const apiVersion = '2017-11-11';
    const url = 'https://mhraproducts4853.search.windows.net/indexes/products-index/docs';
    
    const fullUrl = url + '?api-version=' + apiVersion+'&$top=170000';
    const params = {
      'method': 'get',
      'headers': {
        'api-key': '17CCFC430C1A78A169B392A35A99C49D'
      }
    };
    const header = [
      '@search.score',
      'rev_label',
      'metadata_storage_path',
      'product_name',
      'created',
      'release_state',
      'keywords',
      'title',
      'territory',
      'file_name',
      'metadata_storage_size',
      'metadata_storage_name',
      'doc_type',
      'suggestions',
      'substance_name',
      'facets' 
    ];
    const body_vals = [];
    const nextLink = [];
    body_vals.push(header);

    // Send the GET request
    const inital_response = UrlFetchApp.fetch(fullUrl, params);
    const parsed = JSON.parse(inital_response.getContentText());
    console.log(Object.keys(parsed));
    console.log(parsed['@odata.nextLink']);
    nextLink.push(parsed['@odata.nextLink']);
    console.log(Object.keys(parsed['value'][0]));

    const iterrows = parsed['value'];
    for (const row of iterrows) {
      const result_row = header.map( h => {
        return row[h];
      });
      body_vals.push(result_row);
    }

    for (let i =0; i<loopcount; i++) {
      console.log('nextLink: ',nextLink[nextLink.length-1]);
      let nl = nextLink[nextLink.length-1];
      console.log("requesting: ",nl);
      // let top = nl.match(top_regex)[1];
      // console.log('top: ', top);

      // const nurl = url + '?api-version=' + apiVersion+'&$top='+top;
      // console.log("requesting: ", nurl);

      const nextResponse = UrlFetchApp.fetch(nl, params);
      const responseJSON = JSON.parse(nextResponse.getContentText());
      const rows = responseJSON['value'];

      for (const row of rows) {
        const result_row = header.map( h => {
          return row[h];
        });
        body_vals.push(result_row);
      }
      console.log("key: ", Object.keys(responseJSON));
      if (responseJSON.hasOwnProperty('@odata.nextLink')) {
        nextLink.push(responseJSON['@odata.nextLink']);
        continue;
      } else {
        console.log("last i: ",i);
        break;
      }
    }
    console.log("vals length:", body_vals.length);
    sheet.getRange(
      1,
      1,
      body_vals.length,
      body_vals[0].length
    ).setValues(body_vals);

    SpreadsheetApp.flush();
  }
  /**
   * Get config from Spreadsheet bound file: https://docs.google.com/spreadsheets/d/11gHVi_UyZmLZ_OlXcApyoIP7ZFuyFKThrIpDQPzIOLw/edit?gid=0#gid=0
   * @returns {Object}
   */
  function getConfig() {
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    let config_sheet = ss.getSheetByName('config');
    let config_range = config_sheet.getDataRange();

    // assume only column A,B will be used.
    let config_data = config_range.getValues().map( r => r.slice(0,2));
    // console.log(config_data);
    
    let raw_config_obj = Object.fromEntries(config_data);
    if (raw_config_obj.isCreateNewSS) {
      let ts = new Date();
      let ssName = 'MHRA-product-info'+ String(ts);
      let newSS = SpreadsheetApp.create(ssName);
      raw_config_obj["target_ssid"] = newSS.getId();
      raw_config_obj["ss_name"] = ssName;
      raw_config_obj["ss_url"] = newSS.getUrl();
      raw_config_obj["isCreatedNew"] = true;
    } else {
      raw_config_obj["target_ssid"] = raw_config_obj["destination_ssid"];

      if (raw_config_obj["target_ssid"] == '') {
        Browser.msgBox('Please specify destination spreadsheet id (ssid) or check isCreateNewSS');
      }

      let existed_ss = SpreadsheetApp.openById(raw_config_obj["target_ssid"]);
      raw_config_obj["ss_name"] = existed_ss.getName();
      raw_config_obj["ss_url"] = existed_ss.getUrl();
      raw_config_obj["isCreatedNew"] = false;
    }
    console.log(raw_config_obj);
    return raw_config_obj;
  }
  /**
   * 
   */
  function logging_config(cf) {
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    let log_sheet = ss.getSheetByName('log');
    let ls_lr = log_sheet.getLastRow()+1;
    let row = [
      [new Date(), cf.ss_name, cf.target_ssid, cf.isCreatedNew]
    ];
    let log_range = log_sheet.getRange(
      ls_lr,
      1,
      row.length,
      row[0].length
    );
    log_range.setValues(row);

    SpreadsheetApp.flush();
  }

  const config = getConfig();
  setRequest(config.target_ssid);
  logging_config(config);

  Browser.msgBox('updated_main data has been created at point: \n ' + '\n' + config.ss_url);
  
}
