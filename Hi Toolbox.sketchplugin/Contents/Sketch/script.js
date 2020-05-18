@import "functions.js";
@import 'delegate.js';
@import "papaparse.min.js";

var sketch = require('sketch');
var document = sketch.getSelectedDocument();
var page = document.selectedPage;

// Config
var pluginName = "Hi Toolbox",
	pluginDomain = "com.sunpan.sketchplugins.symbol-organizer",
	titleGroupName = "Titles",
	titleStyleFont = {
		fontFamily : ["SFProText-Bold","SFUIText-Bold","HelveticaNeue-Bold"],
		fontFace : "SFProText-Bold",
		fontSize : 20,
		fontColor : (isUsingDarkTheme()) ? "FFFFFF": "000000",
		lineHeight : 24,
		textAlignment : 0
	},
	debugMode = false;

// Strings
var strPageContainsArtboards = "This page contains artboards and symbols. Symbol Organizer can only be used on pages with just symbols.",
	strNoSymbolsOnPage = "There are no symbols to organize on this page.",
	strSymbolLayoutComplete = "Symbols are now organized",
	strAlertInformativeText = "Organize your symbols page alphabetically (including layer list) and into groups, determined by your symbol names.",
	strGroupGranularityDesc = "Specifies the \"/\" position in each symbol name which should define the group.",
	strSymbolMaxPerRow = "Max Per Row",
	strSymbolMaxPerCol = "Max Per Column";

var config = function(context) {
	organize(context,"config");
}

var run = function(context) {
	organize(context,"run");
}

var suffix_openedSymbol="_symbolopened";
var symbol_bg_name="_hibg";
var symbol_hotbox_name="_hotbox";
var symbol_datatext_name="_hidatatext";


var exportTextStyles= function(context) {

	var filename=getFilePathByPanel(context);
	var styles = context.document.documentData().layerTextStyles().sharedStyles() ;	
	//var styles = context.document.documentData().layerTextStyles().objectsSortedByName();
	

	var sorted_styles=[];
	styles.forEach(style => {sorted_styles.push(style);});

	//sorted_styles.sort(function(a,b){return b.style().textStyle().attributes().NSFont.pointSize()-a.style().textStyle().attributes().NSFont.pointSize();});
	//sorted_styles.sort(function(a,b){return b.style().textStyle().attributes().NSFont.pointSize()-a.style().textStyle().attributes().NSFont.pointSize();});

	var data=[];

	sorted_styles.forEach(style => {
		log("forEach");
		
		log("name="+toJSString(style.name())+"FontSize="+style.style().textStyle().attributes().NSFont.pointSize());


		var attributes=style.style().textStyle().attributes();

		var row={};
		row["Key"]=toJSString(style.name());
		row["FontName"]=(attributes.NSFont!=null)?toJSString(attributes.NSFont.familyName()):"";
		row["FontSize"]=(attributes.NSFont!=null)?toJSString(attributes.NSFont.pointSize()):"";
		row["FontColor"]=(attributes.MSAttributedStringColorAttribute!=null)?colorToHex(attributes.MSAttributedStringColorAttribute):"";
		row["CharacterSpacing"]=(attributes.NSKern!=null)?toJSString(attributes.NSKern):"0";
		row["LineSpacing"]=(attributes.NSParagraphStyle!=null)?toJSString(attributes.NSParagraphStyle.lineSpacing()):"0";
		row["HorizontalAlign"]=(attributes.NSParagraphStyle!=null)?alignment2String(attributes.NSParagraphStyle.alignment()):"center";
		row["VerticalAlign"]=(attributes.textStyleVerticalAlignmentKey!=null)?valignment2String(style.style().textStyle().verticalAlignment()):"middle";
		
		
		row["Underline"]=(attributes.NSUnderline!=null)?attributes.NSUnderline:"0";
		
		
		var firstEnabledBorder=style.style().firstEnabledBorder();
		row["OutLine"]=(firstEnabledBorder!=null)?"1":"0";
		row["OutlineColor"]=(firstEnabledBorder!=null)?colorToHex(firstEnabledBorder.color()):"";
		row["OutLineSize"]=(firstEnabledBorder!=null)?toJSString(firstEnabledBorder.thickness()):"";
		
		
		
		var firstEnabledShadow=style.style().firstEnabledShadow();
		row["Shadow"]=(firstEnabledShadow!=null)?"1":"0";
		row["ShadowColor"]=(firstEnabledShadow!=null)?colorToHex(firstEnabledShadow.color()):"";
		row["ShadowOffsetX"]=(firstEnabledShadow!=null)?toJSString(firstEnabledShadow.offsetX()):"";
		row["ShadowOffsetY"]=(firstEnabledShadow!=null)?toJSString(firstEnabledShadow.offsetY()):"";
		row["ShadowBlur"]=(firstEnabledShadow!=null)?toJSString(firstEnabledShadow.blurRadius()):"";
		
/*
		
		
		row["NSKern"]=attributes.NSKern;
		row["NSStrikethrough"]=attributes.NSStrikethrough;
		row["NSFont"]=attributes.NSFont;
		row["NSStrikethrough"]=attributes.NSStrikethrough;
		row["textStyleVerticalAlignmentKey"]=attributes.textStyleVerticalAlignmentKey;
		row["MSAttributedStringColorAttribute"]=attributes.MSAttributedStringColorAttribute;
		row["NSParagraphStyle"]=attributes.NSParagraphStyle;
		row["NSUnderline"]=attributes.NSUnderline;

		row["Attributes"]=JSON.stringify(attributes);
		
*/		
		
		data.push(row);
	});

	log("data"+data);

	var csv = Papa.unparse(data);
	writeFile(filename,'\ufeff'+csv);
}
var generateTextStyleArtboard=function(context){

	var toPage =getPagebyName(context,"TextStyles",true);
	var newArtboard=MSArtboardGroup.new();
	var artboard_width=2000;
	//var artboard_height=2000;
	newArtboard.frame().setX(100);
	newArtboard.frame().setY(0);			
	newArtboard.frame().setWidth(artboard_width);
	//newArtboard.setHasBackgroundColor(true);
	//newArtboard.setBackgroundColor(NSColor.colorWithRed_green_blue_alpha(0.33, 0.33, 0, 1));

	//newArtboard.frame().setHeight(artboard_height);	
	toPage.addLayers([newArtboard]);
	
	var styles = context.document.documentData().layerTextStyles().sharedStyles() ;	
	//var styles = context.document.documentData().layerTextStyles().objectsSortedByName();
	
	newArtboard.setName("TextStyles Count="+styles.length);

	var textY=50;



	var sorted_styles=[];

	styles.forEach(style => {sorted_styles.push(style);});



	sorted_styles.sort(function(a,b){return b.style().textStyle().attributes().NSFont.pointSize()-a.style().textStyle().attributes().NSFont.pointSize();});
	//sorted_styles.sort(a,b => {return a.localeCompare(b);});




	sorted_styles.forEach(style => {
		log("forEach");
		var newText=MSTextLayer.new();
		newArtboard.addLayers([newText]);
		log("name="+toJSString(style.name())+"FontSize="+style.style().textStyle().attributes().NSFont.pointSize());
		//newText.style().setTextStyle(style.style().textStyle());
       // newText.style().setTextStyle(textStyle);
		//newText.setSharedStyle(toJSString(style.objectID()));
	//	log("setStringValue="+toJSString(style.name()));
		newText.setStringValue(toJSString(style.name()));
	//	log("addLayers");
     //   newText.setTextBehaviour(1);
    //    newText.setTextBehaviour(0);
		
		
        newText.setSharedStyle(style);

		newText.frame().setX(50);
		newText.frame().setY(textY);	
		textY+=20+newText.frame().height();

		newText.setName(toJSString(style.name()));
	});


	newArtboard.frame().setHeight(textY);
    newArtboard.setHasBackgroundColor(true);
    newArtboard.setBackgroundColor(MSColor.colorWithRed_green_blue_alpha(0.67, 0.33, 0.67, 1));	

};

var addToResourcePage=function(context){
	var toPage =getPagebyName(context,"Resource",true);

	var artboard=getLayerbyName(context,"Resource",toPage,true);
	if(artboard==null)
	{
		log("create artboard");
		artboard=MSArtboardGroup.new();
		artboard.setHasBackgroundColor(true);
		artboard.setBackgroundColor(MSColor.colorWithRed_green_blue_alpha(0.67, 0.33, 0.67, 1));	
		var artboard_width=2000;
		//var artboard_height=2000;
		artboard.frame().setX(100);
		artboard.frame().setY(0);			
		artboard.frame().setWidth(artboard_width);
		//newArtboard.setHasBackgroundColor(true);
		//newArtboard.setBackgroundColor(NSColor.colorWithRed_green_blue_alpha(0.33, 0.33, 0, 1));

		//newArtboard.frame().setHeight(artboard_height);
		artboard.setName("Resource");	
		toPage.addLayers([artboard]);
	}
	


	var selected_layers=context.document.selectedLayers().layers();
	if(selected_layers.length!=1)
	{
		sketch.UI.alert("Error","请选择至少一个控件(MSSymbolMaster)。");
		return;
	}

	selected_layers.forEach(layer=>{


		log("add"+layer);

		found=getLayersbySymbolMaster(context,layer.id,artboard,true);
		if(found.length==0)
		{
			var symbolInstance = layer.newSymbolInstance();
			symbolInstance.frame().setX(layer.frame().x());
			symbolInstance.frame().setY(layer.frame().y());
			artboard.addLayers([symbolInstance]);
		}
		else
		{
			
			sketch.UI.alert("Error","控件加入失败，因为已经有了."+layer.name);
		}


	});


};


var hotBoxAdd=function(context){
	
	var selected_layers=context.document.selectedLayers().layers();
	if(selected_layers.length!=1)
	{
		sketch.UI.alert("Error","请选择一个控件(symbolMaster)。");
		return;
	}
	var symbolMaster=selected_layers[0];
	//确认是SymbolInstance
	if(symbolMaster.className()!="MSSymbolMaster")
	{
		sketch.UI.alert("Error","请选择一个控件(symbolMaster)。现在选择的是"+symbolMaster.className());
		return;
	}
	
	var symbol_hotbox=getLayerbyName(context,symbol_hotbox_name,symbolMaster,true);
	if(symbol_hotbox!=null)removeLayer(symbol_hotbox);
	
	
	log("symbolMaster.frame().width()"+symbolMaster.frame().width());
	
	
	symbol_hotbox=MSRectangleShape.new();
	
	var width=Math.max(symbolMaster.frame().width(),90);
	var height=Math.max(symbolMaster.frame().height(),90);
	var offsetX=Math.floor(width-symbolMaster.frame().width())/2;
	var offsetY=Math.floor(height-symbolMaster.frame().height())/2;
	
	
	
    var color = MSColor.colorWithRed_green_blue_alpha(255/255, 0/255, 0/255, 0.3);
	
	
	symbol_hotbox.setFrame(MSRect.rectWithRect(NSMakeRect(-offsetX,-offsetY,width,height)));
	symbolMaster.addLayers([symbol_hotbox]);
    symbol_hotbox.style().addStylePartOfType(0);
    symbol_hotbox.style().fills().firstObject().setColor(color);
	symbol_hotbox.setName(symbol_hotbox_name);
	symbol_hotbox.setResizingConstraint(0x12);
	
	
	
};
var hotBoxShowAll=function(context){
	var openedSymbolLayers=getLayersbyName(context,symbol_hotbox_name,null,false);
	openedSymbolLayers.forEach(function(layer){layer.setIsVisible(true);});
};
var hotBoxHideAll=function(context){
	var openedSymbolLayers=getLayersbyName(context,symbol_hotbox_name,null,false);
	openedSymbolLayers.forEach(function(layer){layer.setIsVisible(false);});
	openedSymbolLayers.forEach(function(layer){layer.frame().setX(Math.floor(layer.frame().x()));layer.frame().setY(Math.floor(layer.frame().y()));});
	
}

var fixExport=function(context){
	var allLayers=getLayersbyName(context,"*",null,false);

	
	allLayers.forEach(function(layer){
		if(layer.exportOptions().exportFormats().count() > 0)
		{
			
				log("export :"+layer.name());
			if(layer.exportOptions().exportFormats().count() > 1)
			{
			//	log("export format count >1:"+layer.name());

			}
			
			if(( new RegExp('^Resources')).test(layer.name()))
			{
		//		log("export Resource:"+layer.name());
				
				if(layer.exportOptions().exportFormats()[0].scale()!=2)
				{
					log("set Scale to 2 "+layer.name());
					layer.exportOptions().exportFormats()[0].setScale(2);
				}
				
			}
			else
			{
				log("remove exportOptions "+layer.name());
				layer.exportOptions().removeAllExportFormats();
				//log("remove exportOptions end"+layer.name());
			}
			
			
						
		}
	
		
		
		
	});
};











var cleanHi=function(context){
	var openedSymbolLayers=getLayersbyName(context,"*"+suffix_openedSymbol,null,false);
	openedSymbolLayers.forEach(function(layer){removeLayer(layer)});
	var openedSymbolLayers=getLayersbyName(context,symbol_bg_name,null,false);
	openedSymbolLayers.forEach(function(layer){removeLayer(layer)});
	var openedSymbolLayers=getLayersbyName(context,symbol_datatext_name,null,false);
	openedSymbolLayers.forEach(function(layer){removeLayer(layer)});
};

//【方案二】
var openSymbolMaster= function(context){
	var selected_layers=context.document.selectedLayers().layers();
	if(selected_layers.length!=1)
	{
		sketch.UI.alert("Error","请选择一个控件的实例(MSSymbolInstance)。");
		return;
	}
	var symbolInstance=selected_layers[0];
	//确认是SymbolInstance
	if(symbolInstance.className()!="MSSymbolInstance")
	{
		sketch.UI.alert("Error","请选择一个控件的实例(MSSymbolInstance)。");
		return;
	}
	var symbolMaster=symbolInstance.symbolMaster();
	
	
	//确认是不是大小没变SymbolInstance
	if(symbolInstance.frame().width()!=symbolMaster.frame().width()
		||symbolInstance.frame().height()!=symbolMaster.frame().height())
	{
		sketch.UI.alert("Error","控件的实例(MSSymbolInstance)的大小需要和控件(MSSymbolMaster)相同。");
		return;
	}
	
	
	var openedGroup=getLayerbyName(context,"*"+suffix_openedSymbol,symbolInstance.parentGroup(),true);
	if(openedGroup)
	{
		sketch.UI.alert("Error","打开的控件的实例已经存在。"+openedGroup.name());
		return;
	}
	
	
	var symbol_bg=getLayerbyName(context,symbol_bg_name,symbolMaster,true);
	if(symbol_bg!=null)removeLayer(symbol_bg);
	symbol_bg=MSRectangleShape.new();
	symbol_bg.setFrame(MSRect.rectWithRect(NSMakeRect(0,0,symbolMaster.frame().width(),symbolMaster.frame().height())));
	symbolMaster.addLayers([symbol_bg]);
	symbol_bg.setName(symbol_bg_name);
	symbol_bg.setResizingConstraint(0x12);
	//var symbolInstanceRect = this.getRect(symbolInstance);
	//复制layer
	var tempSymbol = symbolInstance.duplicate();
	
	//解开复制layer
	openedGroup = tempSymbol.detachStylesAndReplaceWithGroupRecursively(false);
	
	
	
	
	//修改layer名字加特别后缀"_symbolopened"
	openedGroup.setName(openedGroup.name()+suffix_openedSymbol);
	
	//隐藏SymbolInstance
	symbolInstance.setIsVisible(false);
	
	
	var data={};
	data["symbolInstance"]=toJSString(symbolInstance.objectID());
	data["symbolMaster"]=toJSString(symbolMaster.objectID());
	
	var symbolMasterChildren = symbolMaster.children();
	//var symbolInstanceChildren = symbolInstance.children();
	var openedGroupChildren = openedGroup.children();
	
	
	
	log("openedGroupChildren.length="+openedGroupChildren.length);
	log("symbolMasterChildren.length="+symbolMasterChildren.length);
	
	
	var objects_map={};
	var i;
	for(i=0;i<openedGroupChildren.length;i++)
	{
		openedGroupChildID=toJSString(openedGroupChildren[i].objectID());
		symbolMasterChildID=toJSString(symbolMasterChildren[i].objectID());
		//symbolInstanceChildID=toJSString(symbolInstanceChildren[1].objectID());
		objects_map[openedGroupChildID]=symbolMasterChildID;
	}		
	symbolMasterChildren=null;
	openedGroupChildren=null;
	removeLayer(symbol_bg);
	
	data["objects_map"]=objects_map;
	
	var symbol_datatext=MSTextLayer.new();
	//log("setName");
	symbol_datatext.setName(symbol_datatext_name);
	//log("setFontSize");
	symbol_datatext.setFontSize(6);
	//log("setTextBehaviour");
	symbol_datatext.setTextBehaviour(1);
	//log("stringify");
	//log("setFrame");
	//symbol_datatext.setFrame(NSMakeRect(0,0,openedGroup.frame().width(),openedGroup.frame().height()));

	//log("symbol_datatext.setIsVisible");
	symbol_datatext.setIsVisible(false);
	symbol_datatext.setStringValue( JSON.stringify(data));
	//     log("addLayers");
	openedGroup.addLayers([symbol_datatext]);
	//log("openedGroup.setIsVisible");
	openedGroup.setIsVisible(true);
	//openedGroup.setSelected(true);
	
	
}
var updateSymbolMaster= function(context){

	//确认是"_symbolopened"
	var selected_layers=context.document.selectedLayers().layers();
	if(selected_layers.length!=1)
	{
		sketch.UI.alert("Error","请选择一个被打开的控件实例(xxxxx_symbolopened)。");
		return;
	}
	var openedGroup=selected_layers[0];
	//确认是Opened SymbolInstance
	if(openedGroup.name().substr(-suffix_openedSymbol.length)!=suffix_openedSymbol)
	{
		sketch.UI.alert("Error","请选择一个被打开的控件实例(xxxxx_symbolopened)。");
		return;
	}
	
	
	var symbol_bg=getLayerbyName(context,symbol_bg_name,openedGroup,true);
	if(symbol_bg==null)
	{
		sketch.UI.alert("Error","Not Found:"+symbol_bg_name);
		return;
	}
	var symbol_datatext=getLayerbyName(context,symbol_datatext_name,openedGroup,true);
	if(symbol_datatext==null)
	{
		sketch.UI.alert("Error","Not Found:"+symbol_datatext_name);
		return;
	}
	
	
	
	
	var datatext=symbol_datatext.stringValue();
	var data=JSON.parse(datatext);
	var objects_map=data["objects_map"];
	
//	log("symbolMaster ID="+data["symbolMaster"]);
	var symbolMaster=getLayerbyID(context,data["symbolMaster"],null,false);
//	log("symbolMaster"+symbolMaster);
	var symbolInstance=getLayerbyID(context,data["symbolInstance"],null,false);
	
	var openedGroupChildren = openedGroup.children();
	var i;
	for(i=0;i<openedGroupChildren.length;i++)
	{
		var openedGroupChild=openedGroupChildren[i];
		if(openedGroupChild.objectID()==openedGroup.objectID()) continue;
		if(openedGroupChild.name()==symbol_bg_name) continue;
		if(openedGroupChild.name()==symbol_datatext_name) continue;
		openedGroupChildID=toJSString(openedGroupChild.objectID());
		symbolMasterChildID=objects_map[openedGroupChildID];
		
		var symbol_bg_x=symbol_bg.frame().x();
		var symbol_bg_y=symbol_bg.frame().y();
		
		if(symbolMasterChildID!=null)
		{
			//找到对应的 SymbolInstance和SymbolMaster
			//console.log(openedGroupChildID, symbolMasterChildID);
			
			symbolMasterChild=getLayerbyID(context,symbolMasterChildID,symbolMaster,false);
	//		log("symbolMasterChild"+symbolMasterChild);
			symbolMasterChild.frame().setX(openedGroupChild.frame().x()-symbol_bg_x);
			symbolMasterChild.frame().setY(openedGroupChild.frame().y()-symbol_bg_y);
			symbolMasterChild.frame().setWidth(openedGroupChild.frame().width());
			symbolMasterChild.frame().setHeight(openedGroupChild.frame().height());
			
		}
		else
		{
			
			
			symbolMasterChild=openedGroupChild.duplicate();
		//	log("symbolMasterChild"+symbolMasterChild);
			symbolMasterChild.frame().setX(openedGroupChild.frame().x()-symbol_bg_x);
			symbolMasterChild.frame().setY(openedGroupChild.frame().y()-symbol_bg_y);
			symbolMasterChild.frame().setWidth(openedGroupChild.frame().width());
			symbolMasterChild.frame().setHeight(openedGroupChild.frame().height());
			symbolMasterChild.removeFromParent();
			symbolMaster.addLayers([symbolMasterChild]);
			
			
			data["objects_map"][openedGroupChildID]=toJSString(symbolMasterChild.objectID());
			
		}
	}		
	
	
	symbol_datatext.setStringValue( JSON.stringify(data));
	
			
	
	
	
	
	
//	finds=symbol.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("name = %@","FixedSafeArea"));
//	var fixedSafeArea=finds[0];
	
	
	
	//计算内有所有子物体的相对位置，并应用到SymbolMaster
	
}













var toAllSize=function(context) {
	
	
	var page =getPagebyName(context,"设计图");
	if ( page ==nil)  page =getPagebyName(context,"效果图");
	if ( page ==nil) page=context.document.currentPage();
	
	stdsize={w:750,h:1334,name:""};
	var allSizes=[
	{w:750,h:1623,name:"9_20"},
	{w:1000,h:1334,name:"3_4"}
	];
	
	deviceSymbols=getSymbolsbyName(context,"Device/*");
	
	log("deviceSymbols.length="+deviceSymbols.length);
	
	deviceSymbols.forEach(function(symbol){
		
		var symbolName=symbol.name();
		var  deviceName=symbolName.substring("Device/".length);
		
		log("deviceName="+deviceName);
		var artBoardSize={width:symbol.frame().width(),height:symbol.frame().height()};
		
		
		
			
		finds=symbol.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("name = %@","FixedSafeArea"));
		var fixedSafeArea=finds[0];
			
		var fixedSafeAreaRect={
			x:fixedSafeArea.frame().x(),
			y:fixedSafeArea.frame().y(),
			width:fixedSafeArea.frame().width(),
			height:fixedSafeArea.frame().height()
		}	
		log(fixedSafeAreaRect);
		
		
		
		
		
		var pageName=page.name()+"_"+deviceName;
		//toPage=page.duplicate();
		//toPage.setName(pageName);

		//var toPage =getPagebyName(context,pageName,false);
		//if(toPage!=nil)toPage.removeFromParent();
		//if(toPage!=nil)toPage.removeFromParent();
		
		
		var toPage =getPagebyName(context,pageName,true,true);
		
		/*
		var artboards=[];
		toPage.artboards().forEach(function(artboard){artboards.push(artboard);});
		artboards.forEach(function(artboard){artboard.removeFromParent();});
		*/
		var i=0;
		
		page.artboards().forEach(function(artboard){

				//log(artboard);
				var newArtboard=artboard.duplicate();
				var newArtboardID=newArtboard.objectID();
				//newArtboard.parent=toPage;
				newArtboard.removeFromParent();
				newArtboard.frame().setX(newArtboard.frame().x()*artBoardSize.width/stdsize.w);
				newArtboard.frame().setY(newArtboard.frame().y()*artBoardSize.height/stdsize.h);			
				newArtboard.frame().setWidth(fixedSafeAreaRect.width);
				newArtboard.frame().setHeight(fixedSafeAreaRect.height);			
						
				toPage.addLayers([newArtboard]);
				
				var frames={};
				
				
				newArtboard.children().forEach(function(layer){
					if(layer.parentGroup().objectID()==newArtboardID)
					{
						if(layer.name().search("Device/")!=0
						&&layer.name()!="【界面】/层/黑蒙"
						&&layer.name()!="【界面】/层/背景"
						&&layer.name()!="界面/层/黑蒙"
						&&layer.name()!="界面/层/背景"
						&&!layer.isLocked())
						{
							//log(layer);
							var frame={
								x:layer.frame().x(),
								y:layer.frame().y(),
								width:layer.frame().width(),
								height:layer.frame().height(),
							};
							frames[layer.objectID()]=frame;
							
						}
					}
				});
				
				//log(frames);
				
				newArtboard.frame().setWidth(artBoardSize.width);
				newArtboard.frame().setHeight(artBoardSize.height);	
				
				//log(newArtboard);
				
				
				var deviceInstance = symbol.newSymbolInstance();
				deviceInstance.frame().setX(0);
				deviceInstance.frame().setY(0);		
				deviceInstance.frame().setWidth(artBoardSize.width);
				deviceInstance.frame().setHeight(artBoardSize.height);	
				newArtboard.addLayers([deviceInstance]);
				
				
				//log("newArtboard.objectID()="+newArtboardID);
			
				newArtboard.children().forEach(function(layer){
					if(layer.parentGroup().objectID()==newArtboardID)
					{
						if(layer.name().search("Device/")!=0
						&&layer.name()!="【界面】/层/黑蒙"
						&&layer.name()!="【界面】/层/背景"
						&&layer.name()!="界面/层/黑蒙"
						&&layer.name()!="界面/层/背景"
						&&!layer.isLocked())
						{
							
							var frame=frames[layer.objectID()];
							if(frame)
							{
								//log("setframe"+frame);
								layer.frame().setX(frame.x+fixedSafeAreaRect.x);
								layer.frame().setY(frame.y+fixedSafeAreaRect.y);		
								layer.frame().setWidth(frame.width);
								layer.frame().setHeight(frame.height);
							}
							
						}
					}
				});
				
				
			
			
			
		});
	
	
	
	});
	
	
	
	
	
	
	
	
	
	
	
	
	
	
}



var organize = function(context,type) {
	// Current page
	
	//var page =getPagebyName(context,"控件");		
	//if ( page ==nil)  page =getPagebyName(context,"组件");		
	
	//if ( page ==nil) 
	var page=context.document.currentPage();

	// If the current page does not have symbols...
	if (page.symbols().count() == 0) {
		sketch.UI.alert(pluginName,strNoSymbolsOnPage);
		return;
	}

	// If the current page does not only contain symbols...
	if (page.artboards().count() != page.symbols().count()) {
		sketch.UI.alert(pluginName,strPageContainsArtboards);
		return;
	}

	// Get layout settings
	var layoutSettings = getLayoutSettings(context,type);

	// If layout settings were retrieved...
	if (layoutSettings) {
		// Layout variables
		var x = 0;
		var y = 0;
		var gPad = parseInt(layoutSettings.gPad);
		var xPad = parseInt(layoutSettings.xPad);
		var yPad = parseInt(layoutSettings.yPad);
		var maxPer = (layoutSettings.maxPer > 0) ? layoutSettings.maxPer : 0;

		// Find titles group
		var titleGroup = findLayerByName(page,titleGroupName);

		// If titles group exists, remove it
		if (titleGroup) page.removeLayer(titleGroup);

		// Create a symbols object, of either all symbols or just Symbols page symbols
		var symbols = (layoutSettings.gatherSymbols == 1) ? (MSApplicationMetadata.metadata().appVersion > 46) ? context.document.documentData().localSymbols() : context.document.documentData().allSymbols() : page.symbols();

		// Sort the symbols object by name
		symbols.sort(sortSymbolsByName);

		// if user wants to rename duplicate symbols...
		if (layoutSettings.renameSymbols == 1) {
			symbols = renameDuplicateSymbols(symbols);
		}

		// If user wants to reverse the sort order
		var sortedSymbols = (layoutSettings.reverseOrder == 1) ? symbols.reverseObjectEnumerator().allObjects() : symbols;

		// Sort the layer list
		sortLayerList(sortedSymbols,page);

		// Create the group object
		var groupLayout = createGroupObject(symbols,layoutSettings.groupDepth);

		// Reset page origin
		page.setRulerBase(CGPointMake(0,0));

		// If user wants to display group titles...
		if (layoutSettings.displayTitles == 1) {
			// Title style variables
			if (layoutSettings.sortDirection == 1) titleStyleFont.textAlignment = 1;
			var offsetHeight = titleStyleFont.lineHeight;

			// Check for title style
			var titleStyle = getTextStyleByName(context,layoutSettings.styleName.trim());

			// If title style does not exist...
			if (!titleStyle) {
				// System font variable
				var systemFontToUse;

				// Iterate through family fonts...
				for (var i = 0; i < titleStyleFont.fontFamily.length; i++) {
					// If a system font has not been determined to exist yet...
					if (!systemFontToUse) {
						// If this system font exists, set system font variable
						if (systemFontExists(titleStyleFont.fontFamily[i])) systemFontToUse = titleStyleFont.fontFamily[i];
					}
				}

				// Update the titleStyleFont object's font face to an existing system font
				titleStyleFont.fontFace = systemFontToUse;

				// Add title style
				titleStyle = addTextStyle(context,layoutSettings.styleName.trim(),createTextStyle(titleStyleFont));
			} else {
				// Title style attributes
				var titleStyleAttributes = titleStyle.style().textStyle().attributes();

				// Respect potential for user modified style
				titleStyleFont.fontFace = titleStyleAttributes.NSFont.fontDescriptor().objectForKey(NSFontNameAttribute);
				titleStyleFont.fontSize = titleStyleAttributes.NSFont.fontDescriptor().objectForKey(NSFontSizeAttribute);
				if (titleStyleAttributes.MSAttributedStringColorAttribute && titleStyleAttributes.MSAttributedStringColorAttribute.hexValue()) titleStyleFont.fontColor = titleStyleAttributes.MSAttributedStringColorAttribute.hexValue();
				titleStyleFont.lineHeight = titleStyleAttributes.NSParagraphStyle.minimumLineHeight();

				// If lineHeight (and thus offset) is 0...
				if (titleStyleFont.lineHeight == 0) {
					// Apply style to a temporary layer
					var tempLayer = MSTextLayer.new();
					tempLayer.setStringValue("Temp");

					if (titleStyle.newInstance) {
						tempLayer.setStyle(titleStyle.newInstance())
					} else {
						tempLayer.setSharedStyle(titleStyle);
					}

					// Get temporary layer height and use as offset
					offsetHeight = tempLayer.frame().height();
				}

				// Update title style
				titleStyle = updateTextStyle(context,layoutSettings.styleName.trim(),createTextStyle(titleStyleFont));
			}

			// Create new screen title group
			titleGroup = MSLayerGroup.new();
			titleGroup.setName(titleGroupName);
			titleGroup.frame().setX((layoutSettings.sortDirection == 0) ? 0 : -xPad);
			titleGroup.frame().setY((layoutSettings.sortDirection == 0) ? -(offsetHeight+yPad) : 0);
			titleGroup.setIsLocked(true);
			titleGroup.setHasClickThrough(true);
		}

		// Set tracker/counters
		var groupSpace = 0;
		var groupCount = 1;
		var objectCount = 1;

		// Iterate through the group object
		for (var i = 0; i < groupLayout.length; i++) {
			// Symbol variables
			var symbol = symbols.objectAtIndex(groupLayout[i]["index"]);
			var symbolFrame = symbol.frame();

			// If user wants to display titles, and this is the first item in the first group, or a brand new group...
			if (layoutSettings.displayTitles == 1 && (objectCount == 1 || groupCount != groupLayout[i]["group"])) {
				// Title position variables
				var titleTextX = 0;
				var titleTextY = 0;
				var titleTextAlign = 0;

				// Update title position variables per the layout direction
				if (layoutSettings.sortDirection == 0) {
					titleTextX = (objectCount == 1) ? 0 : x + groupSpace + gPad;
				} else {
					titleTextY = (objectCount == 1) ? 0 : y + groupSpace + gPad;
					titleTextAlign = 1;
				}

				// Create screen title
				var screenTitle = MSTextLayer.new();
				screenTitle.setStringValue(groupLayout[i]["prefix"]);
				screenTitle.setName(groupLayout[i]["prefix"]);

				if (titleTextAlign == 0) {
					screenTitle.frame().setY(titleTextY);
					screenTitle.frame().setX(titleTextX);
				} else {
					screenTitle.frame().setY(titleTextY);
					screenTitle.frame().setX(titleTextX - screenTitle.frame().width());
				}

				// Set screen title style
				if (titleStyle.newInstance) {
					screenTitle.setStyle(titleStyle.newInstance());
				} else {
					screenTitle.setSharedStyle(titleStyle);
				}

				// Add screen title to title group
				titleGroup.addLayers([screenTitle]);
			}

			// If the current group number doesn't match the group counter
			if (groupLayout[i]["group"] != groupCount) {
				// Update group position variables per the layout direction
				if (layoutSettings.sortDirection == 0) {
					// Reset y position, set the x position of the next row
					y = 0;
					x += groupSpace + gPad;
				} else {
					// Reset x position, set the y position of the next row
					x = 0;
					y += groupSpace + gPad;
				}

				// Reset the group space tracker
				groupSpace = 0;

				// Increment the group counter
				groupCount++;

				// Reset the object counter
				objectCount = 1;
			}

			// If the max per row is greater than 0, and object count is greater than max per row
			if (maxPer > 0 && objectCount > maxPer) {
				// Update group position variables per the layout direction
				if (layoutSettings.sortDirection == 0) {
					// Reset y position, set the x position of the next row
					y = 0;
					x += groupSpace + xPad;
				} else {
					// Reset x position, set the y position of the next row
					x = 0;
					y += groupSpace + yPad;
				}

				// Reset the group space tracker
				groupSpace = 0;

				// Reset the object counter
				objectCount = 1;
			}

			// Position the symbol
			symbolFrame.x = x;
			symbolFrame.y = y;

			// Update group position variables per the layout direction
			if (layoutSettings.sortDirection == 0) {
				// If this symbol is wider than previous symbols in row
				if (symbolFrame.width() > groupSpace) {
					// Increase the width of the row
					groupSpace = symbolFrame.width();
				}

				// Set the y position for the next symbol
				y += symbolFrame.height() + yPad;
			} else {
				// If this symbol is taller than previous symbols in row
				if (symbolFrame.height() > groupSpace) {
					// Increase the height of the row
					groupSpace = symbolFrame.height();
				}

				// Set the x position for the next symbol
				x += symbolFrame.width() + xPad;
			}

			// Increment the object counter
			objectCount++;
		}

		// If user wants to display group titles...
		if (layoutSettings.displayTitles == 1) {
			// Add title group to page
			page.addLayers([titleGroup]);

			// Resize title group
			if (sketch.version.sketch > 52) {
				titleGroup.fixGeometryWithOptions(0);
			} else {
				titleGroup.resizeToFitChildrenWithOption(0);
			}
		}

		// Collapse symbols
		actionWithType(context,"MSCollapseAllGroupsAction").doPerformAction(nil);

		
		// If user wants to zoom out...
		if (layoutSettings.zoomOut == 1) {
			// Adjust view
			context.document.contentDrawView().zoomToFitRect(page.contentBounds());       
		}
		
		

		var pageName = page.name()+"_ins";
		
		
		var outputPage =getPagebyName(context,pageName,true,true);	

		//var outputSymbols = context.document.documentData().localSymbols();
		
		var outputSymbols = symbols;

		artboard=MSArtboardGroup.new();
		artboard.setHasBackgroundColor(true);
		artboard.setBackgroundColor(MSColor.colorWithRed_green_blue_alpha(0.67, 0.33, 0.67, 1));	
		var artboard_width=2000;
		//var artboard_height=2000;
		//newArtboard.setBackgroundColor(NSColor.colorWithRed_green_blue_alpha(0.33, 0.33, 0, 1));

		//newArtboard.frame().setHeight(artboard_height);
		artboard.setName("Resource");	
		outputPage.addLayers([artboard]);



		var minX=0,minY=0;
		var maxX=0,maxY=0;
		var symbolInstances=[];
		outputSymbols.forEach(function(symbol){
			var symbolMaster =  symbol;
			var symbolInstance = symbolMaster.newSymbolInstance();
			symbolInstance.frame().setX(symbolMaster.frame().x());
			symbolInstance.frame().setY(symbolMaster.frame().y());
			symbolInstances.push(symbolInstance);
			minX=Math.min(minX,symbolMaster.frame().x());
			minY=Math.min(minY,symbolMaster.frame().y());
			maxX=Math.max(maxX,symbolMaster.frame().x()+symbolMaster.frame().width());
			maxY=Math.max(maxY,symbolMaster.frame().y()+symbolMaster.frame().height());

		});
		artboard.frame().setX(minX-50);
		artboard.frame().setY(minY-50);
		artboard.frame().setWidth(maxX-minX+100);
		artboard.frame().setHeight(maxY-minY+100);			
		//artboard.frame().setWidth(artboard_width);
		//newArtboard.setHasBackgroundColor(true);
		
		artboard.addLayers(symbolInstances);

		
		
		// If user wants to zoom out...
		if (layoutSettings.zoomOut == 1) {
			// Adjust view
			context.document.contentDrawView().zoomToFitRect(outputPage.contentBounds());
		}

		// Feedback to user
		sketch.UI.message(strSymbolLayoutComplete);

		if (!debugMode) googleAnalytics(context,"organize",type);
	}
}

var remove = function(context) {
	var exemptSymbols = getExemptSymbols(),
		removeSymbols = [],
		listItemHeight = 24,
		count = 0;

	var predicate = NSPredicate.predicateWithFormat("className == %@ && isSafeToDelete == 1","MSSymbolMaster"),
		symbols = context.document.currentPage().children().filteredArrayUsingPredicate(predicate);

	symbols.forEach(function(symbol){
		if (exemptSymbols.indexOf(String(symbol.symbolID())) == -1) removeSymbols.push(symbol);
	});

	if (removeSymbols.length == 0) {
		sketch.UI.alert(pluginName,'All symbols appear to be in use, nothing to remove!');

		return false;
	}

	var alertWindow = COSAlertWindow.new();
	alertWindow.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path()));
	alertWindow.setMessageText("Remove Unused Symbols");
	alertWindow.setInformativeText("The following symbols appear to be unused. Symbols which are nested in other symbols, or used as overrides, were ignored.");

	var symbolListInnerFrameHeight = listItemHeight * (removeSymbols.length),
		symbolListFrame = NSScrollView.alloc().initWithFrame(NSMakeRect(0,0,300,200)),
		symbolListFrameSize = symbolListFrame.contentSize(),
		symbolListInnerFrame = NSView.alloc().initWithFrame(NSMakeRect(0,0,symbolListFrameSize.width,symbolListInnerFrameHeight));

	symbolListFrame.setHasVerticalScroller(true);
	symbolListInnerFrame.setFlipped(true);
	symbolListFrame.setDocumentView(symbolListInnerFrame);

	for (var i = 0; i < removeSymbols.length; i++) {
		symbolListInnerFrame.addSubview(createCheckbox({name:removeSymbols[i].name(),value:i},1,NSMakeRect(0,listItemHeight*count,300,listItemHeight)));
		count++;
	}

	symbolListInnerFrame.scrollPoint(NSMakePoint(0,0));

	alertWindow.addAccessoryView(symbolListFrame);

	alertWindow.addButtonWithTitle("Remove Selected");
	alertWindow.addButtonWithTitle("Cancel");

	var responseCode = alertWindow.runModal();

	if (responseCode == 1000) {
		var symbolsToRemove = [];

		for (var i = 0; i < removeSymbols.length; i++) {
			if ([symbolListInnerFrame subviews][i].state() == 1) symbolsToRemove.push([symbolListInnerFrame subviews][i].tag());
		}

		if (symbolsToRemove.length == 0) {
			sketch.UI.alert(pluginName,"You didn't select anything to remove.");

			return false;
		}

		for (var i = 0; i < symbolsToRemove.length; i++) {
			var symbolIndex = symbolsToRemove[i],
				symbolToRemove = removeSymbols[symbolIndex];

			symbolToRemove.removeFromParent();

			log(symbolToRemove.name() + " was removed by Symbol Organizer");
		}

		sketch.UI.message(symbolsToRemove.length + " unused symbol(s) removed");
	} else return false;

	if (!debugMode) googleAnalytics(context,"remove","remove");
}

var report = function(context) {
	openUrl("https://github.com/sonburn/symbol-organizer/issues/new");

	if (!debugMode) googleAnalytics(context,"report","report");
}

var plugins = function(context) {
	openUrl("https://sonburn.github.io/");

	if (!debugMode) googleAnalytics(context,"plugins","plugins");
}

var donate = function(context) {
	openUrl("https://www.paypal.me/sonburn");

	if (!debugMode) googleAnalytics(context,"donate","donate");
}

function getLayoutSettings(context,type) {
	// Page variables
	var page = context.document.currentPage(),
		pageInfo = page.userInfo();

	// Setting variables
	var defaultSettings = {};
	defaultSettings.globalSettings = 1;
	defaultSettings.groupDepth = 1;
	defaultSettings.sortDirection = 0;
	defaultSettings.gPad = "200";
	defaultSettings.displayTitles = 0;
	defaultSettings.styleName = "Symbol Organizer/Group Title";
	defaultSettings.reverseOrder = 0;
	defaultSettings.gatherSymbols = 0;
	defaultSettings.xPad = "100";
	defaultSettings.yPad = "100";
	defaultSettings.maxPer = "";
	defaultSettings.renameSymbols = 0;
	defaultSettings.zoomOut = 1;
	defaultSettings.updateInstanceSheet = 1;

	// Get document settings
	var documentSettings = updateSettingsWithDocument(context,defaultSettings);

	// If there are document settings, but no globalSettings value...
	if (pageInfo && pageInfo[pluginDomain] && !pageInfo[pluginDomain]["globalSettings"]) {
		// Ensure previous document settings are shown first
		documentSettings.globalSettings = 0;
	}

	// Determine which settings should be used
	defaultSettings = (documentSettings.globalSettings == 0) ? documentSettings : updateSettingsWithGlobal(getUserDefaults(pluginDomain),defaultSettings);

	// If type is set and equal to "config", operate in config mode...
	if (type && type == "config") {
		var fieldHeight = 22,
			fieldWidth = 60,
			labelHeight = 16,
			leftColWidth = 120,
			maxPerLabelText = (defaultSettings.sortDirection == 0) ? strSymbolMaxPerCol : strSymbolMaxPerRow,
			settingPad = 10,
			settingX = 0,
			settingY = 0,
			switchHeight = 16,
			textOffset = 2,
			windowWidth = 350;

		var alert = NSAlert.alloc().init(),
			alertIconPath = context.plugin.urlForResourceNamed("icon.png").path(),
			alertIcon = NSImage.alloc().initByReferencingFile(alertIconPath),
			alertContent = NSView.alloc().init();

		alert.setIcon(alertIcon);
		alert.setMessageText(pluginName);
		alert.setInformativeText(strAlertInformativeText);

		alertContent.setFlipped(true);

		var globalSettingsLabel = createBoldLabel("Global Settings",12,NSMakeRect(0,settingY,leftColWidth,labelHeight));
		alertContent.addSubview(globalSettingsLabel);

		var globalSettingsValue = createCheckbox({name:"Use & modify global settings",value:1},defaultSettings.globalSettings,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,switchHeight));
		alertContent.addSubview(globalSettingsValue);

		globalSettingsValue.setAction("callAction:");
		globalSettingsValue.setCOSJSTargetFunction(function(sender) {
			var originalSettings = (sender.state() == 0) ? updateSettingsWithDocument(context,defaultSettings) : updateSettingsWithGlobal(getUserDefaults(pluginDomain),defaultSettings);

			groupGranularityValue.selectItemAtIndex(originalSettings.groupDepth);
			groupDirectionValue.selectCellAtRow_column(originalSettings.sortDirection,0);
			groupSpaceValue.setStringValue(originalSettings.gPad);
			groupTitlesCheckbox.setState(originalSettings.displayTitles);
			styleNameValue.setStringValue(originalSettings.styleName);
			styleNameValue.setEnabled(groupTitlesCheckbox.state());
			reverseOrderCheckbox.setState(originalSettings.reverseOrder);
			updateInstanceSheetCheckbox.setState(originalSettings.updateInstanceSheet);
			gatherSymbolsCheckbox.setState(originalSettings.gatherSymbols);
			horizontalSpaceValue.setStringValue(originalSettings.xPad);
			verticalSpaceValue.setStringValue(originalSettings.yPad);
			symbolMaxPerValue.setStringValue(originalSettings.maxPer);
			renameSymbolsCheckbox.setState(originalSettings.renameSymbols);
			zoomOutCheckbox.setState(originalSettings.zoomOut);
		});

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var divider = createDivider(NSMakeRect(0,settingY,windowWidth,1));
		alertContent.addSubview(divider);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var groupGranularityLabel = createBoldLabel("Group Definition",12,NSMakeRect(0,settingY + textOffset * 2,leftColWidth,labelHeight));
		alertContent.addSubview(groupGranularityLabel);

		var groupGranularityValue = createSelect(["1st","2nd","3rd","4th","5th","6th","7th","8th"],defaultSettings.groupDepth,NSMakeRect(leftColWidth,settingY,fieldWidth,28));
		alertContent.addSubview(groupGranularityValue);

		var groupGranularityExtra = createLabel("Match",12,NSMakeRect(CGRectGetMaxX(groupGranularityValue.frame()) + textOffset,settingY + textOffset * 2,60,labelHeight));
		alertContent.addSubview(groupGranularityExtra);

		settingY = CGRectGetMaxY(groupGranularityValue.frame()) + textOffset;

		var groupGranularityDesc = createDescription(strGroupGranularityDesc,11,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,28));
		alertContent.addSubview(groupGranularityDesc);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var groupDirectionLabel = createBoldLabel("Layout Direction",12,NSMakeRect(0,settingY,leftColWidth,labelHeight));
		alertContent.addSubview(groupDirectionLabel);

		var groupDirectionValue = createRadioButtons(["Horizontal","Vertical"],defaultSettings.sortDirection,0,leftColWidth,settingY);
		alertContent.addSubview(groupDirectionValue);

		groupDirectionValue.cells().objectAtIndex(0).setAction("callAction:");
		groupDirectionValue.cells().objectAtIndex(0).setCOSJSTargetFunction(function(sender) {
			symbolMaxPerLabel.setStringValue(strSymbolMaxPerCol);
		});

		groupDirectionValue.cells().objectAtIndex(1).setAction("callAction:");
		groupDirectionValue.cells().objectAtIndex(1).setCOSJSTargetFunction(function(sender) {
			symbolMaxPerLabel.setStringValue(strSymbolMaxPerRow);
		});

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var groupSpaceLabel = createBoldLabel("Group Space",12,NSMakeRect(0,settingY,leftColWidth,labelHeight));
		alertContent.addSubview(groupSpaceLabel);

		var groupSpaceValue = createField(defaultSettings.gPad,NSMakeRect(leftColWidth,settingY,fieldWidth,fieldHeight));
		alertContent.addSubview(groupSpaceValue);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad + textOffset;

		var divider = createDivider(NSMakeRect(0,settingY,windowWidth,1));
		alertContent.addSubview(divider);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var groupTitlesCheckbox = createCheckbox({name:"Display group titles",value:1},defaultSettings.displayTitles,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,switchHeight));
		alertContent.addSubview(groupTitlesCheckbox);

		groupTitlesCheckbox.setAction("callAction:");
		groupTitlesCheckbox.setCOSJSTargetFunction(function(sender) {
			styleNameValue.setEnabled(sender.state());
		});

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var styleNameLabel = createBoldLabel("Title Style Name",12,NSMakeRect(0,settingY + textOffset,leftColWidth,labelHeight));
		alertContent.addSubview(styleNameLabel);

		var styleNameValue = createField(defaultSettings.styleName,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,fieldHeight));
		alertContent.addSubview(styleNameValue);

		styleNameValue.setEnabled(groupTitlesCheckbox.state());

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var divider = createDivider(NSMakeRect(0,settingY,windowWidth,1));
		alertContent.addSubview(divider);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var reverseOrderLabel = createBoldLabel("Layer List",12,NSMakeRect(0,settingY,leftColWidth,labelHeight));
		alertContent.addSubview(reverseOrderLabel);

		var reverseOrderCheckbox = createCheckbox({name:"Reverse sort order",value:1},defaultSettings.reverseOrder,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,switchHeight));
		alertContent.addSubview(reverseOrderCheckbox);
		
		
		

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var divider = createDivider(NSMakeRect(0,settingY,windowWidth,1));
		alertContent.addSubview(divider);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var gatherSymbolsCheckbox = createCheckbox({name:"Gather symbols from other pages",value:1},defaultSettings.gatherSymbols,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,switchHeight));
		alertContent.addSubview(gatherSymbolsCheckbox);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var spacingLabel = createBoldLabel("Spacing",12,NSMakeRect(0,settingY + textOffset,leftColWidth,labelHeight));
		alertContent.addSubview(spacingLabel);

		var horizontalSpaceValue = createField(defaultSettings.xPad,NSMakeRect(leftColWidth,settingY,fieldWidth,fieldHeight));
		alertContent.addSubview(horizontalSpaceValue);

		settingX = CGRectGetMaxX(alertContent.subviews().lastObject().frame()) + textOffset;

		var horizontalSpaceLabel = createLabel("X",12,NSMakeRect(settingX,settingY + textOffset,leftColWidth,labelHeight));
		alertContent.addSubview(horizontalSpaceLabel);

		var verticalSpaceValue = createField(defaultSettings.yPad,NSMakeRect(settingX + settingPad * 3,settingY,fieldWidth,fieldHeight));
		alertContent.addSubview(verticalSpaceValue);

		settingX = CGRectGetMaxX(alertContent.subviews().lastObject().frame()) + textOffset;

		var verticalSpaceLabel = createLabel("Y",12,NSMakeRect(settingX,settingY + textOffset,leftColWidth,labelHeight));
		alertContent.addSubview(verticalSpaceLabel);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var symbolMaxPerLabel = createBoldLabel(maxPerLabelText,12,NSMakeRect(0,settingY + textOffset,leftColWidth,labelHeight));
		alertContent.addSubview(symbolMaxPerLabel);

		var symbolMaxPerValue = createField(defaultSettings.maxPer,NSMakeRect(leftColWidth,settingY,fieldWidth,fieldHeight));
		alertContent.addSubview(symbolMaxPerValue);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var renameSymbolsCheckbox = createCheckbox({name:"Sequentially number duplicates",value:1},defaultSettings.renameSymbols,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,switchHeight));
		alertContent.addSubview(renameSymbolsCheckbox);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var zoomOutCheckbox = createCheckbox({name:"Zoom & center after organizing",value:1},defaultSettings.zoomOut,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,switchHeight));
		alertContent.addSubview(zoomOutCheckbox);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var divider = createDivider(NSMakeRect(0,settingY,windowWidth,1));
		alertContent.addSubview(divider);
		
		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;
		var updateInstanceSheetLabel = createBoldLabel("Instance Sheet",12,NSMakeRect(0,settingY,leftColWidth,labelHeight));
		alertContent.addSubview(updateInstanceSheetLabel);

		var  updateInstanceSheetCheckbox = createCheckbox({name:"Update",value:1},defaultSettings.updateInstanceSheet,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,switchHeight));
		alertContent.addSubview( updateInstanceSheetCheckbox);
		
		
		
		alertContent.frame = NSMakeRect(0,0,windowWidth,CGRectGetMaxY(updateInstanceSheetCheckbox.frame()));

		alert.accessoryView = alertContent;

		var buttonOrganize = alert.addButtonWithTitle("Organize");
		var buttonCancel = alert.addButtonWithTitle("Cancel");

		setKeyOrder(alert,[
			globalSettingsValue,
			groupGranularityValue,
			groupDirectionValue,
			groupSpaceValue,
			groupTitlesCheckbox,
			styleNameValue,
			reverseOrderCheckbox,
			gatherSymbolsCheckbox,
			horizontalSpaceValue,
			verticalSpaceValue,
			symbolMaxPerValue,
			renameSymbolsCheckbox,
			zoomOutCheckbox,
			updateInstanceSheetCheckbox,
			buttonOrganize
		]);

		var responseCode = alert.runModal();

		if (responseCode == 1000) {
			if (globalSettingsValue.state() == 1) {
				sketch.Settings.setLayerSettingForKey(page,"globalSettings",globalSettingsValue.state());

				var userDefaults = getUserDefaults(pluginDomain);

				userDefaults.setObject_forKey(groupGranularityValue.indexOfSelectedItem(),"groupDepth");
				userDefaults.setObject_forKey(groupDirectionValue.selectedCell().tag(),"sortDirection");
				userDefaults.setObject_forKey(groupSpaceValue.stringValue(),"gPad");
				userDefaults.setObject_forKey(groupTitlesCheckbox.state(),"displayTitles");
				userDefaults.setObject_forKey(styleNameValue.stringValue(),"styleName");
				userDefaults.setObject_forKey(reverseOrderCheckbox.state(),"reverseOrder");
				userDefaults.setObject_forKey(gatherSymbolsCheckbox.state(),"gatherSymbols");
				userDefaults.setObject_forKey(horizontalSpaceValue.stringValue(),"xPad");
				userDefaults.setObject_forKey(verticalSpaceValue.stringValue(),"yPad");
				userDefaults.setObject_forKey(symbolMaxPerValue.stringValue(),"maxPer");
				userDefaults.setObject_forKey(renameSymbolsCheckbox.state(),"renameSymbols");
				userDefaults.setObject_forKey(zoomOutCheckbox.state(),"zoomOut");
				userDefaults.setObject_forKey(updateInstanceSheetCheckbox.state(),"updateInstanceSheet");
				userDefaults.synchronize();
			} else {
				sketch.Settings.setLayerSettingForKey(page,"globalSettings",globalSettingsValue.state());
				sketch.Settings.setLayerSettingForKey(page,"groupDepth",groupGranularityValue.indexOfSelectedItem());
				sketch.Settings.setLayerSettingForKey(page,"sortDirection",groupDirectionValue.selectedCell().tag());
				sketch.Settings.setLayerSettingForKey(page,"gPad",groupSpaceValue.stringValue());
				sketch.Settings.setLayerSettingForKey(page,"displayTitles",groupTitlesCheckbox.state());
				sketch.Settings.setLayerSettingForKey(page,"styleName",styleNameValue.stringValue());
				sketch.Settings.setLayerSettingForKey(page,"reverseOrder",reverseOrderCheckbox.state());
				sketch.Settings.setLayerSettingForKey(page,"gatherSymbols",gatherSymbolsCheckbox.state());
				sketch.Settings.setLayerSettingForKey(page,"xPad",horizontalSpaceValue.stringValue());
				sketch.Settings.setLayerSettingForKey(page,"yPad",verticalSpaceValue.stringValue());
				sketch.Settings.setLayerSettingForKey(page,"maxPer",symbolMaxPerValue.stringValue());
				sketch.Settings.setLayerSettingForKey(page,"renameSymbols",renameSymbolsCheckbox.state());
				sketch.Settings.setLayerSettingForKey(page,"zoomOut",zoomOutCheckbox.state());
				sketch.Settings.setLayerSettingForKey(page,"updateInstanceSheet",updateInstanceSheetCheckbox.state());
			}

			return {
				groupDepth : groupGranularityValue.indexOfSelectedItem(),
				sortDirection : groupDirectionValue.selectedCell().tag(),
				gPad : groupSpaceValue.stringValue(),
				displayTitles : groupTitlesCheckbox.state(),
				styleName : styleNameValue.stringValue(),
				reverseOrder : reverseOrderCheckbox.state(),
				gatherSymbols : gatherSymbolsCheckbox.state(),
				xPad : horizontalSpaceValue.stringValue(),
				yPad : verticalSpaceValue.stringValue(),
				maxPer : symbolMaxPerValue.stringValue(),
				renameSymbols : renameSymbolsCheckbox.state(),
				zoomOut : zoomOutCheckbox.state(),
				updateInstanceSheet : updateInstanceSheetCheckbox.state()
			}
		} else return false;
	}
	// Otherwise operate in run mode...
	else {
		// Return updated settings
		return {
			groupDepth : defaultSettings.groupDepth,
			sortDirection : defaultSettings.sortDirection,
			gPad : defaultSettings.gPad,
			displayTitles : defaultSettings.displayTitles,
			styleName : defaultSettings.styleName,
			reverseOrder : defaultSettings.reverseOrder,
			gatherSymbols : defaultSettings.gatherSymbols,
			xPad : defaultSettings.xPad,
			yPad : defaultSettings.yPad,
			maxPer : defaultSettings.maxPer,
			renameSymbols : defaultSettings.renameSymbols,
			zoomOut : defaultSettings.zoomOut,
			updateInstanceSheet : defaultSettings.updateInstanceSheet
		}
	}
}
function importForeignSymbol(symbol,library) {
	var objectReference = MSShareableObjectReference.referenceForShareableObject_inLibrary(symbol,library);

	return AppController.sharedInstance().librariesController().importShareableObjectReference_intoDocument(objectReference,data);
}
