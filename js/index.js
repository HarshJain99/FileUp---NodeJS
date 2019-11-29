var res = [];

function myAlert(msg){
  $('.alert').fadeIn();
  var html = '';
  html += '<div class="alert">';
  html +=   msg;
  html += '</div>';
  $('body').append(html);
  setTimeout(function(){
    $('.alert').fadeOut();
  },3100);
}

function showLoader(){
  $('.loaderBox').fadeIn();
}

function hideLoader(){
  $('.loaderBox').fadeOut();
}

function openSearchBar(){
  if($('.searchBarContainer').hasClass("openSearchBar")){
    $('.searchBarContainer').css('min-height','4vh');
    $('.searchResults').html('');
    $(".imageContainer").css("padding-top","8.5vh");
    $('.searchBarContainer').removeClass("openSearchBar").css("display","none");
    $('#search').val('');
    return;
  }
  $(".imageContainer").css("padding-top","12.5vh");
  $('.searchBarContainer').addClass("openSearchBar").css("display","block");
}

function searchImages(){
  var search = $('#search').val().trim();
  if(search == undefined || search.length == 0){
    myAlert("Can not be empty");
    $('#search').val('');
    return;
  }
  showLoader();
  $.ajax({
    url    : '/filterImages',
    method : 'POST',
    data   : {filter:search}
  }).done(function(result){
      var res = JSON.parse(result);
      var html = '';
      for(i=0; i<res.length; i++){
        if(i%3==0){
          html += '<div class="imageHolder">';
        }
        html += '  <img src="' + res[i] + '" onclick="openFullImage(this,' + i + ',0)" />';
        if(i%3==2){
          html += '</div>';
        }
      }
      html += '</div>';
      $('.searchResults').html(html);
      $('.searchBarContainer').css('min-height','93vh');
      hideLoader();
  });

}

function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      $('#preview').attr('src', e.target.result);
    }
    reader.readAsDataURL(input.files[0]);
    $('#button').show();
  }
}

function closeFullImage(){
  $('.fullImageContainer').fadeOut();
}

function setPaths(pth){
  $('.options span:nth-child(1)').attr('onclick', "getDetailsForImage('" + pth + "')");
  $('.options span:nth-child(2)').attr('onclick', "getTextForImage('" + pth + "')");
  $('.options span:nth-child(3)').attr('onclick', "delImage('" + pth + "')");
  $('.saveTitleForImage').attr('onclick',"saveTitleForImage('" + pth + "')")
}

function prevImg(){
  var index =  localStorage.getItem('index');
  if(index <= 0){
    return;
  }
  index = parseInt(parseInt(index)-parseInt(1));
  if(index <= 0){
    $('.prevImg').fadeOut();
  }
  if(index <= res.length-1){
    $('.nextImg').fadeIn();
  }

  var pth = 'http://localhost:3000/' + res[index];
  $('.fullImage').attr('src',res[index]);
  $('.peopleInFrameContainer').fadeOut().removeClass("open");
  $('.getTextForImage').fadeOut().removeClass("open");
  setPaths(pth);
  localStorage.setItem('index', index);
}

function nextImg(){
  var index =  localStorage.getItem('index');
  if(index >= res.length-1){
    return;
  }
  index = parseInt(parseInt(index)+parseInt(1));
  if(index >= res.length-1){
    $('.nextImg').fadeOut();
  }
  else{
    $('.prevImg').fadeIn();
  }

  var pth = 'http://localhost:3000/' + res[index];
  $('.fullImage').attr('src',res[index]);
  $('.peopleInFrameContainer').fadeOut().removeClass("open");
  $('.getTextForImage').fadeOut().removeClass("open");
  setPaths(pth);
  localStorage.setItem('index', index);
}

function getDetailsForImage(src){
  if($('.getTextForImage').hasClass("open")){
    getTextForImage(src);
  }
  if($('.peopleInFrameContainer').hasClass("open")){
    $('.peopleInFrameContainer').fadeOut().removeClass("open");
    $('.fullImage').attr('src', src);
    return;
  }
  showLoader();
  $.ajax({
    url    : '/execPython',
    method : 'POST',
    data   : {src:src}
  }).done(function(result){
      var res = JSON.parse(result);
      var pth = '..\\modified\\' + res[0].split(' ')[1];//.split("\\")[6];
      myAlert(res[0] + ' faces detected');
      $('.fullImage').attr('src', pth);
      if(res[1]!=null && res[1].length > 0 ){
        $('#peopleInFrame').val(res[1].join(', '));
        $('.peopleInFrameContainer').fadeIn().addClass("open");
      }
      else{
        $('#peopleInFrame').val('Error detecting faces');
        $('.peopleInFrameContainer').fadeIn().addClass("open");
      }
      hideLoader();
  });
}

function delImage(src){
  src = src.split('/')[4];
  showLoader();
  $.ajax({
    url    : '/delImage',
    method : 'POST',
    data   : {src:src}
  }).done(function(result){
      var res = JSON.parse(result).split(' ');
      myAlert('Image Deleted');
      hideLoader();
      setTimeout(function(){
         window.location.assign(window.location.href);
      } , 2000)
  });
}

function getTextForImage(src){
  if($('.peopleInFrameContainer').hasClass("open")){
    getDetailsForImage(src);
  }
  if($('.getTextForImage').hasClass("open")){
    $('.getTextForImage').fadeOut().removeClass("open");
    return;
  }
  src = src.split('/')[4];
  showLoader();
  $.ajax({
    url    : '/getTextForImage',
    method : 'POST',
    data   : {src:src}
  }).done(function(result){
      var res = JSON.parse(result);
      res = res.join(', ');
      $('#textForImage').val(res);
      $('.getTextForImage').fadeIn().addClass("open");
      hideLoader();
  });
}

function saveTitleForImage(src){
  var src   = src.split('/')[4];
  var title = $('#textForImage').val();
  showLoader();
  $.ajax({
    url    : '/saveTextForImage',
    method : 'POST',
    data   : {src:src, title:title}
  }).done(function(result){
      var res = JSON.parse(result);
      myAlert(res);
      hideLoader();
  });
}

function openFullImage(e, index, allowPrevNext){
  var html = '';
  localStorage.setItem('index', index);
  html += '  <span class="prevImg" onclick="prevImg()"><span><</span></span>';
  html += '  <img class="fullImage" src="' + e.src + '"/>';
  html += '  <span class="nextImg" onclick="nextImg()"><span>></span></span>';
  html += '  <span class="options">';
  html += '    <span onclick="getDetailsForImage(\'' + e.src + '\')" ><img src="../html/fd.png" alt="FD"/> <span>FD</span></span>';
  html += '    <span onclick="getTextForImage(\'' + e.src + '\')" ><img src="../html/fd.png" alt="TXT"/> <span>Caption</span></span>';
  html += '    <span onclick="delImage(\'' + e.src + '\')" ><img src="../html/delete.png" alt="DEl"/> <span>Delete</span></span>';
  html += '  </span>';
  html += '  <span class="getTextForImage">';
  html += '     <input type="text" id="textForImage" />';
  html += '     <button class="saveTitleForImage" onclick="saveTitleForImage(\'' + e.src + '\')">Save</button>';
  html += '  </span>';
  html += '  <span class="peopleInFrameContainer">';
  html += '     <input type="text" id="peopleInFrame" readonly/>';
  html += '  </span>';
  $('.fullImageContainer').html(html).css("display","flex");

  $('.getTextForImage').fadeOut();
  $('.peopleInFrameContainer').fadeOut();
  $('.fullImageContainer').fadeIn().on("click", e=>{
    if(e.target.localName == 'div'){
        closeFullImage();
    }
  })
  if(index >= res.length-1 || allowPrevNext == 0){
    $('.nextImg').fadeOut();
  }
  if(index <= 0 || allowPrevNext == 0){
    $('.prevImg').fadeOut();
  }

}

function getFileNames(){
  $.ajax({
    url    : '/getFileNames/',
    method : 'POST',
    data   : {test: 'trial'}
  }).done(function(result){
        res  = JSON.parse(result);
        var html = '';
        for(i=0; i<res.length; i++){
          if(i%3==0){
            html += '<div class="imageHolder">';
          }
          html += '  <img src="' + res[i] + '" onclick="openFullImage(this,' + i + ', 1)" />';
          if(i%3==2){
            html += '</div>';
          }
        }
        html += '</div>';
        $('.imageContainer').append(html);
      });
}

$(document).ready(function(){
  $('#button').hide();

  $("#photo").change(function() {
    readURL(this);
  });

  $('.form1').submit(function(e){
      showLoader();
      $(this).ajaxSubmit({
       data: {},
       contentType: 'application/json',
       success: function(response){
         hideLoader();
         myAlert(response);
         $('#preview').attr('src', '');
         $('#photo').attr('src', '');
         setTimeout(function(){
            window.location.assign(window.location.href);
         } , 2000)
       }
      });
      return false;
  });

  getFileNames();
  hideLoader();
})
