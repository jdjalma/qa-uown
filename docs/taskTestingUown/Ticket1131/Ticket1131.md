----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1131

UOWN | Origination | Bug on LOCATION Field (Overview Filter Dashboard)

BUG
Investigate Overview filters queries

For testing, please compare the merchant and location filters behavior in qa1 and sandbox.
This is what I changed:
Removed duplication for the filters (merchant, location). Lines with the same value will no longer appear.
When selecting a merchant, the locations filter will be rendered based on the selected merchant.

---

UOWN | Originação | Bug no campo LOCALIZAÇÃO (Filtro do Painel de Visão Geral)

BUG Investigar consultas dos filtros de Visão Geral

Para teste, por favor, compare o comportamento dos filtros de comerciante e localização nos ambientes qa1 e sandbox. Estas foram as alterações realizadas:

Remoção de duplicações nos filtros (comerciante, localização). Linhas com valores idênticos não serão mais exibidas.
Ao selecionar um comerciante, o filtro de localizações será renderizado com base no comerciante selecionado."

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

components/overview-summary-dashboard/index.tsx 
+
17
−
4

Visualizado
@@ -25,6 +25,7 @@ export const OverviewSummaryDashboard = ({
  showFilters
}: OverviewSummaryDashboardProps) => {
  const merchants = overviewStore.leadFilterOptions?.merchantRefCodes ?? [];
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);

  useEffect(() => {
    merchantStore.getAllClientTypes();
@@ -96,9 +97,23 @@ export const OverviewSummaryDashboard = ({
  });

  useEffect(() => {
    setFilteredLocations([...new Set(merchants.map((m) => m.merchantLocation))]);
    dashboardFormik.submitForm();
  }, []);

  useEffect(() => {
    const getLocationNamesByMerchant = async () => {
      const merchant = dashboardFormik.values.merchant;
      if (!merchant) {
        setFilteredLocations([...new Set(merchants.map((m) => m.merchantLocation))]);
        return
      };
      const locationNames = await overviewStore.getLocationNamesByMerchant([merchant]);
      setFilteredLocations(locationNames);
    }
    getLocationNamesByMerchant();
  }, [dashboardFormik.values.merchant])

  return (
    <Col xs={12} xl={10}>
      <Row>
@@ -129,15 +144,13 @@ export const OverviewSummaryDashboard = ({
                    name: 'merchant',
                    type: 'select',
                    label: 'Merchant',
                    options: merchants?.map((merchant) => merchant.merchantName),
                    options: [...new Set(merchants?.map((merchant) => merchant.merchantName))],
                  },
                  {
                    name: 'location',
                    type: 'select',
                    label: 'location',
                    options: merchants?.map(
                      (merchant) => merchant.merchantLocation,
                    ),
                    options: filteredLocations,
                  },
                  {
                    name: 'clientType',

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------                    

SELECT DISTINCT location_name, city, state, zip_code
FROM uown_merchant
WHERE is_active = true 
AND (is_deleted = false OR is_deleted IS NULL)
ORDER BY location_name;

--

{
161 Powersports	ffad	TX	34243
1st Class Medical		AL	
1st Class Medical	afdeafd	AL	92002
2 Hermanos Furniture	Houston	TX	77087
4J Jewelers			
A-1 Archery		AL	
A2i Wheel and Tire		AL	
AAMCO Tempe	Phoenix	AZ	85282
Aamco Transmission	San Antonio	TX	78230
AAMCO Van Buren	Phoenix	AZ	85003
Ace Fitness Equipment		AL	
Ace furniture	Columbus	GA	31903
Advanced Fuel Dynamics		TX	
Affordable Fine Furniture (TX) (Dyallen Enterprises)	Houston	TX	77029
Affordable Furniture To Go	Avon	MA	2322
Affordable Medical USA		AL	
Airforcesuspension			
Alamo Tire Service	Corpus Christi	TX	78410
Alberts Home Furnishings (Wayne)	Wayne	MI	48184
Alexis Furniture 3	Bronx	NY	10457
Alexis Furniture 4	Jamaica	NY	11432
All Around E-Bike			
Alligator Performance		AL	
American Factory Direct Furniture Outlets 2	Long Beach	MS	39560
American Factory Direct Furniture Outlets 3	Baton Rouge	LA	70815
American Furniture Galleries (Chandler)	Chandler	AZ	85224
American Quality Health Products		AL	
Amro Music Store		AL	
Appliance Outlet	Magnolia	TX	77354
Appliance Outlet Hillcroft	Houston	TX	77081
Arlington Powersports		TX	
Armor Lite Components		AL	
Artesian Builds			
Ashley Homestore (Flint)	Flint	MI	48507
Athenas Furniture Outlet Amarillo	Amarillo	TX	79107
ATV Wholesale Outlet		AL	
A Used Parts, LLC			
Austin Powersports		AL	
Auto Part Max		FL	
Ballerz Inc Wheels and Tires	Bell	CA	90201
Bananas At Large		AL	
BBO Poker Tables		AL	
BB Wheels LLC	Hayward	FL	94542
BDS Tire & Auto Repair Group	Slidell	LA	70458
Belmont Ebikes			
BEST FURNITURE OUTLET LLC	Lansing	MI	48917
Best Power Wheelchair			
Better Body Equipment		AL	
B&h Wheels And Tires LLC	Dallas	GA	30157
Big A's Furniture Mattress LLC	San Antonio	TX	78223
Big Boyz Tires & Wheels		FL	
Bi-Rite Furniture (PT)	Houston	AL	77076
BODEGA FURNITURE ET	Las Vegas	NV	89119
Bodykore		AL	
Bois & Cuir		AL	
Bolt Fitness Supply		AL	
Boost District		AL	
Bridge	Tampa	FL	33612
Brilliance Jewelers			
Brillianteers		AL	
Bull Creek Outdoors		AL	
BuyOnTrust - Uown Test	Tampa	FL	33612
BuyOnTrust - Uown Test Furniture	Tampa	FL	33612
Cal Tire and AutoWorks		AL	
Cameron's Tire Shop	Austin	TX	78723
Canales Furniture	Plano	TX	75074
Canales Furniture Harry Hines	Dallas	TX	75220
Canales Furniture Irving	Irving	TX	75062
Canales Furniture Legacy	Arlington	TX	76018
Canales Furniture Lewisville	Lewisville	TX	75067
Canales Furniture Mesquite	Mesquite	TX	75150
Cardio Club		AL	
Carolina Coops			
Carol's Furniture Inc	North Chesterfield	VA	23235
Carroll's Tire Warehouse - Hanford -	Hanford	CA	93230
Casa Bella Furniture			
CASA DESIGN FURNITURE CORP	Miami	FL	33126
Casa Mia	Austin	TX	78723
Cash Cow Homestore	Gallup	NM	87301
CBI Offroad		AL	
Central city tires	Columbus	OH	43232
Chatham Furniture & More (Ashland)	Chicago	IL	60636
Chicago Music Exchange		AL	
Choate Engines		AL	
Choice Pay	Tampa	FL	33612
Clean Origin (PT)		AL	
Coco Furniture Gallery (40th st)	Miami	FL	33165
Coco & Lemon LLC		AL	
Comfy Furniture	Irving	TX	75062
Complete Gym Solutions LLC			
Conecta Mobile	Miami	FL	33130
Cozi Furniture	Newcarrollton	MD	20784
CPAPmyway		FL	
Crazy Jay’s Furniture & Sleep Shop (PT)		KS	
Custom Folding Wagons		CA	
Cygnus Performance		FL	
Cygnus Performance	afdea	FL	92002
d2bdmotorwerks			
Dallas Power Sports		AL	
Danca Furniture	Little Rock	AR	72210
Daniel's Jewelers (101) Bell Gardens	Bell Gardens	CA	90201
Daniel's Jewelers (102) Norwalk	Norwalk	CA	90650
Daniel's Jewelers (106) San Bernardino	San Bernardino	CA	92410
Daniel's Jewelers (107) West Covina	West Covina	CA	91790
Daniel's Jewelers (109) Lakewood	Lakewood	CA	90712
Daniel's Jewelers (110) Carson	Carson	CA	90746
Daniel's Jewelers (117) Eagle Rock	Los Angeles	CA	90041
Daniel's Jewelers (119) Monterey Park	Monterey Park	CA	91754
Daniel's Jewelers (120) Fox Hills	Culver City	CA	90230
Daniel's Jewelers (122) Fontana	Fontana	CA	92335
Daniel's Jewelers (124) Cerritos	Cerritos	CA	90703
Daniel's Jewelers (177) Salinas	Salinas	CA	93906
Daniel's Jewelers (178) Chino Hills	Chino Hills	CA	91709
Daniel's Jewelers (180) Westminster	Westminster	CA	92683
Daniel's Jewelers (181) Clovis	Clovis	CA	93612
Daniel's Jewelers (182) South Gate	South Gate	CA	90280
Daniel's Jewelers (183) Tulare	Tulare	CA	93274
Daniel's Jewelers (184) Mainplace	Santa Ana	CA	92705
Daniel's Jewelers (185) Hayward	Hayward	CA	94545
Daniel's Jewelers (186) Valencia	Valencia	CA	91355
Daniel's Jewelers (187) Milpitas	Milpitas	CA	95035
Daniel's Jewelers (188) Grossmont	La Mesa	CA	91942
Daniel's Jewelers (189) Menifee	Menifee	CA	92584
Daniel's Jewelers (190) Modesto	Modesto	CA	95356
Daniel's Jewelers (191) San Jose	San Jose	CA	95122
Daniel's Jewelers (193) Newark	Newark	CA	94560
Daniel's Jewelers (195) Capitola	Capitola	CA	95010
Daniel's Jewelers (196) Vallejo	Vallejo	CA	94591
Daniel's Jewelers (197) San Bruno	San Bruno	CA	94066
Daniel's Jewelers (199) El Centro	El Centro	CA	92243
Daniel's Jewelers (204) Whittwood	Whittier	CA	90603
Daniel's Jewelers (214) Carlsbad	Carlsbad	CA	92008
Daniel's Jewelers (215) Mira Mesa	San Diego	CA	92126
Daniel's Jewelers (223) Parkway (El Cajon)	El Cajon	CA	92020
Daniel's Jewelers (225) Puente Hills	City Of Industry	CA	91748
Daniel's Jewelers (227) Victorville	Victorville	CA	92392
Daniel's Jewelers (229) Huntington Park	Huntington Park	CA	90255
Daniel's Jewelers (230) Baldwin Hills	Los Angeles	CA	90008
Daniel's Jewelers (232) Bakersfield	Bakersfield	CA	93306
Daniel's Jewelers (233) Panorama City	Panorama City	CA	91402
Daniel's Jewelers (234) Bonita	National City	CA	91950
Daniel's Jewelers (236) Santa Maria	Santa Maria	CA	93454
Daniel's Jewelers (237) Orange	Orange	CA	92865
Daniel's Jewelers (238) Towngate	Moreno Valley	CA	92553
Daniel's Jewelers (240) Montebello	Montebello	CA	90640
Daniel's Jewelers (241) Valley Plaza	Bakersfield	CA	93304
Daniel's Jewelers (242) Chula Vista	Chula Vista	CA	91910
Daniel's Jewelers (243) Antelope Valley	Palmdale	CA	93551
Daniel's Jewelers (244) Inland Center	San Bernardino	CA	92408
Daniel's Jewelers (245) Pacific View	Ventura	CA	93003
Daniel's Jewelers (247) Buena Park	Buena Park	CA	90620
Daniel's Jewelers (248) The Rose	Oxnard	CA	93030
Daniel's Jewelers (249) Stonewood	Downey	CA	90241
Daniel's Jewelers (250) Northridge	Northridge	CA	91324
Daniel's Jewelers (251) Pico Rivera	Pico Rivera	CA	90660
Daniel's Jewelers (252) Tyler	Riverside	CA	92503
Daniel's Jewelers (253) Escondido	Escondido	CA	92025
Daniel's Jewelers (254) Montclair Plaza	Montclair	CA	91763
Daniel's Jewelers (256) Mission Valley	San Diego	CA	92108
Daniel's Jewelers (258) Santa Anita	Arcadia	CA	91007
Daniel's Jewelers (259) Riverside	Riverside	CA	92506
Daniel's Jewelers (260) Palm Desert	Palm Desert	CA	92260
Daniel's Jewelers (262) Inglewood	Inglewood	CA	90303
Daniel's Jewelers (263) Topanga	Canoga Park	CA	91303
Daniel's Jewelers (265) Glendale	Glendale	CA	91210
Daniel's Jewelers (266) Ontario	Ontario	CA	91764
Daniel's Jewelers (267) Hanford	Hanford	CA	93230
Daniel's Jewelers (268) Del Amo	Torrance	CA	90503
Daniel's Jewelers (270) Compton	Compton	CA	90220
Daniel's Jewelers (271) Las Americas	San Ysidro	CA	92173
Daniel's Jewelers (272) Paso Robles	Paso Robles	CA	93446
Daniel's Jewelers (273) Hemet	Hemet	CA	92545
Daniel's Jewelers (274) Fresno	Fresno	CA	93710
Daniel's Jewelers (275) Temecula	Temecula	CA	92591
Daniel's Jewelers (276) Dos Lagos	Corona	CA	92883
Daniel's Jewelers (301) Camarillo	Camarillo	CA	93010
Daniel's Jewelers (302) Stockton	Stockton	CA	95207
Daniel's Jewelers (303) Fairfield	Fairfield	CA	94533
Daniel's Jewelers (304) Hesperia	Hesperia	CA	92345
Daniel's Jewelers (306) Park Place (Tucson)	Tucson	AZ	85711
Daniel's Jewelers (307) Chandler	Chandler	AZ	85226
Daniel's Jewelers (308) Tempe	Tempe	AZ	85282
Daniel's Jewelers (309) Tucson	Tucson	AZ	85705
Daniel's Jewelers (310) Phoenix	Phoenix	AZ	85033
Daniel's Jewelers (311) Mesa	Mesa	AZ	85206
Daniel's Jewelers (312) Thousand Oaks	Thousand Oaks	CA	91360
Daniel's Jewelers (313) Perris	Perris	CA	92571
Daniel's Jewelers (315) Sugar Land	Sugar Land	TX	77479
Daniel's Jewelers (316) Las Vegas	Las Vegas	NV	89107
Daniel's Jewelers (317) Deerbrook (Houston)	Humble	TX	77338
Daniel's Jewelers (318) Henderson	Henderson	NV	89014
Daniel's Jewelers (319) Laredo	Laredo	TX	78041
Daniel's Jewelers (321) San Antonio	San Antonio	TX	78216
Daniel's Jewelers (322) Ingram Park (San Antonio)	San Antonio	TX	78238
Daniel's Jewelers (323) Arrowhead Towne Center	Glendale	AZ	85308
Daniel's Jewelers (324) Victoria	Victoria	TX	77904
Daniel's Jewelers (325) Lake Jackson (Tx)	Lake Jackson	TX	77566
Daniel's Jewelers (326) Mcallen (Tx)	Mcallen	TX	78503
Daniel's Jewelers (327) Centennial (Las Vegas)	Las Vegas	NV	89149
Daniel's Jewelers (328) Killeen	Killeen	TX	76543
Daniel's Jewelers (329) Visalia	Visalia	CA	93277
Daniel's Jewelers (330) Lakeline	Cedar Park	TX	78613
Daniel's Jewelers (331) Willowbrook	Houston	TX	77070
Daniel's Jewelers (332) Albuquerque	Albuquerque	NM	87110
Daniel's Jewelers (333) Premium South (Las Vegas)	Las Vegas	NV	89123
Daniel's Jewelers (334) Arroyo (Las Vegas)	Las Vegas	NV	89110
Daniel's Jewelers (335) Georgia Online	null	GA	null
Daniel's Jewelers (336) Florida Online	null	FL	null
Daniel's Jewelers POS TEST	Mesa	AZ	85206
Dealzer		AL	
Designs By Simmons	Las Vegas	NV	89146
Diamond Gallery		AZ	
Diamond Home Furniture	Houston	TX	77060
Digital Storm		AL	
Divine Wood (Port Richmond)	Staten Island	NY	10302
Dme of America		FL	
Droppin HZ Car Audio		VA	
DynoNuggie Laptop		AL	
Eastside Motorsports		AL	
Element Wheels		AZ	
Elite Roads/WheelMax		AL	
Enchanted Fairies Studio LLC	Plano	TX	75093
Engines & Transmissions of America		AL	
epcVip	City	CA	90703
EPO Fee Merchant Test	Tampa	FL	33612
Everly	Tampa	FL	33612
EverlyOC	Oceanside	CA	93058
Eworld Computer			
Exclusive Furniture Humble Corp	Humble	TX	77338
Exotic Diamonds		TX	
Express Aero Kits		AL	
Eyemed Georgia_Alabama	Hayward	GA	30009
EZ Pawn - N0001	San Antonio	TX	78201
FalconEye Electronics		AL	
Family Furniture II	South Houston	TX	77502
Family Go Karts		AL	
Farmers Beaufort	Beaufort	SC	29902
Farmers Bessemer	Bessemer	AL	35020
Farmers Bremen	Bremen	GA	30110
Farmers Carrollton	Carrollton	GA	30117
Farmers Douglas	Douglas	GA	31533
Farmers Duluth	Duluth	GA	30096
Farmers Ellijay	East Ellijay	GA	30540
Farmers Enterprise	Enterprise	AL	36330
Farmers Greenwood	Greenwood	SC	29646
Farmers Hiram	Hiram	GA	30141
Farmers Huntsville	Huntsville	AL	35810
Farmers Jackson	Jackson	TN	38305
Farmers Kingsport	Kingsport	TN	37664
Farmers Laurens	Laurens	SC	29360
Farmers Lavonia	Lavonia	GA	30553
Farmers Madison	Madison	GA	30650
Farmers Martin	Martin	TN	38237
Farmers Moncks Corner	Moncks Corner	SC	29461
Farmers Palatka	Palatka	FL	32177
Farmers Quincy	Quincy	FL	32351
Farmers Reidsville	Reidsville	GA	31326
Farmers St. Augustine	St. Augustine	FL	32086
Farmers Walterboro	Walterboro	SC	29488
Fine Line	San Benito	TX	78586
firstApp			
FirstApp	Tampa	FL	33612
Fit 4 Sale		AL	
Fitness Restored	Thomaston	CT	06787
Fitness Superstore		AL	
FIZGaming			
Fizuas		AL	
flexxBuy			
Floba Home Goods			
formPiper	City	CA	92612
Fraser Engines	ffad	AL	34243
FreeRider USA			
Frost NYC			
Furniture 4 less 1	Villa Park  Illinois	IL	60181
furniture city	Baker	LA	70714
Furniture City	Jackson	MS	39209
Furniture City Gallery	Marietta	GA	30064
Furniture Connection	Cincinnati	OH	45255
Furniture Connextion	Tucson	AZ	85705
Furniture Direct	Orangeburg	SC	29115
Furniture Expo	Richardson	TX	75081
Furniture Express Hawaii	Honolulu	HI	96825
Furniture Express USA (ONLINE)		TX	
Furniture Mall - Duluth	Duluth	GA	30096
Furniture Mart (New Orleans)	New Orleans	LA	70127
Furniture & Mattress Discounters	Chandler	AZ	85224
Furniture & Mattress Discounters	Tampa	FL	33592
Furniture & More	Pasadena	TX	77502
Furniture Outlet 1	Augusta	GA	30907
Furniture Outlet (Waco)	Waco	TX	76710
Furniture Palace 1	Moreno Valley	CA	92551
Furniture Source (Southside Blvd)	Jacksonville	FL	33256
Furniture To Go			
Furniture To Go	Dallas	TX	75207
G8Only.com		AL	
Galaxy Furniture	Chester	PA	19013
Georgia Furniture Mart  (Kennesaw)	Kennesaw	GA	30144
G-Force Powersports		AL	
GK Test	Hayward	CA	92604
Glam Furniture Outlet	Irving	TX	76061
Glassskinz			
Glenn's Tires (AFK)	American Fork	UT	84003
Glens Tires and Wheels		AL	
Go Grit		MA	
Go Mattress	Sandy	UT	84070
Good Air X			
GoPower Sports		TX	
Go Powertrain		AL	
Grand Discount Furniture	Houston	TX	77055
GRAYS FURNITURE	Porterville	CA	93257
Great Wheels		AL	
Gudusu Inc dba: Mattress Man Stores	Tampa	FL	33592
Hart’s Diesel		AL	
Hayward	Hayward	CA	94542
Henebry's Danville Mall	Danville	VA	24540-4082
Henebry's New River Valley Mall	Christiansburg	VA	24073
Henebry's River Ridge Mall	Lynchburg	VA	24502-2241
Henebry's Staunton	Staunton	VA	24401
Henebry's Valley View Mall	Roanoke	VA	24012-2001
Home Furnishings Depot	Staten Island	NY	10302
Home Styles Furniture	Stockton	CA	95205
Hometown Furnishings	Brockton	MA	2301
Hometown Furniture	Sulphur	LA	70663
Ideal Furniture Orange County	Orange County	CA	92867
InstantFinance24	San Diego	CA	92108
Ivan Smith Furniture (Bastrop)	Bastrop	LA	71220
Ivan Smith Furniture (Bossier)	Bossier City	LA	71112
Jaguar Power Sports		AL	
JAZ Services		TX	
JC's		AL	
JD Customs USA		AL	
Jealse Scooters		FL	
Jeans Furniture	Eustis	FL	32726
Jen Speed Solutions		AL	
Jerusalem of 3rd Avenue	Bronx	NY	10455
JFL Diamonds & Timepieces			
jhdg	irvine	NC	27009
J&K Engines		AL	
JM Auto Racing		AL	
JMD Furniture	Marlboro Pike District Heights	MD	20747
Johnston Jewelers	Centralia	IL	62801
K and R Furniture	Oakdale	LA	71463
Kartoyz	Athens	GA	30605
Katz Tires	Marion	OH	43302
Katz Tires - Chillicothe	Chillicothe	OH	45601
Katz Tires - Norton	Norton	OH	44203
Kevin's Jewelers (Modesto)	Modesto	CA	95356
KINGS FURNITURE AND MATTRESS (MIAMISBURG)	Miamisburg	OH	45342
Kings Warehouse Furniture (NY)	Brooklyn	NY	11212
Kings Wheels			
King Wheel & Tire #7	Dallas	TX	75203
King Wheel & Tire Mansfield	Mansfield	TX	76063
Knight’s Mattress & Furniture	American Fork	UT	84003
Kornerstone Credit Online	South Jordan	UT	84095
Kornerstone Living	South Jordan	UT	84095
Kornerstone Living (TestGroup4)	South Jordan	UT	84095
Kornerstone Living (TestGroup5)	South Jordan	UT	84095
Kornerstone Living (TestGroup6)	South Jordan	UT	84095
LA Motor Toys			
Lefty furniture.	Bronx	NY	10454
LendPro	Charlottesville	CA	92614
Lewie's APPLIANCES Pelham	Pelham	AL	35124
LIFESTYLES FURNITURE (Brooklyn)	Brooklyn	NY	11203
Lifted 4x4		TX	
Lonestar Mattress And Furniture	Houston	TX	77084
LPT Medical		AL	
Lu-An Furniture	Houston	TX	77072
Luna Furniture (PT) DO NOT USE	Houston	AL	77036
LV Sofa Factory, Inc.	Henderson	NV	89011
M2S Bikes		NC	
Mac Star Cameras & Electronic		AL	
Mac Star Computers		AL	
Madison Home Furniture 2 Inc	Queens Village	NY	11429
Manta PC Tools USA Inc		TX	
Marcos Everly	Tampa	FL	33612
Massage Medik		AL	
Mattress and More Liquidators (Laurel)	Laurel	DE	19956
Mattress Direct Of The Triad	Kernersville	NC	27284
Mattresses and Furniture	Oklahoma City	OK	73128
Mattresses For Less (Online)		TX	
Mattress Experts		TX	
Mattress Today Yakima	Yakima	WA	98902
Maverick Motorsport		AL	
Mazer Appliance (PT)		AL	
McGillteak		AL	
MELISSA FURNITURE	Little Rock	AR	72205
MerchantTest01	ffad	TX	34243
MerchantTest02	Tampa	FL	33777
Meta PC		AZ	
MichaelElectronics2		AL	
Midas Test 3	Tampa	FL	33592
Mini Max Electronics		AL	
Mississippi Power Sports		AL	
Mobley Fine Furniture	Perry	GA	31069
Modernize Home	Hayward	CA	94542
Modernize Home 2	Hayward	CA	94542
Mojo's Music			
Monsters Transmission		FL	
Motorcycle Clinic		FL	
My Own Wheels		AL	
MYR		AL	
NC Scooter		AL	
Never Enough Auto Accessories			
NewApp_TEst	Hayward	CA	94542
Newport	Hayward	CA	94542
Next Level Furniture	irvine	NC	27009
Off Road Rim Financing	Hobart	IN	46342
Off Road Rim Financing02	Hobart	IN	46342
Off Road Tents		AL	
OJB Jewelry			
ONYX Motorbikes		AL	
Orleans (Gentilly)	New Orleans	LA	70126
Patriot Mobility		AL	
Paty Furniture	Burien	WA	98166
Payless Furniture  and APPLIANCES 3	Paragould	AR	72450
Pay-less Furniture & Appliance #1	Jonesboro	AR	72401
Pay Possible - Test	Test	FL	33612
Pay Tomorrow		AL	
Pay Tomorrow	Tampa	FL	33592
Pedego Deland		AL	
Piedmont Ramp Solutions		AL	
Pinch A Penny 38		FL	
playmusic123.com			
Price Busters - Glen Burnie (5103)	Glen Burnie	MD	21225
Prime Style		FL	
Prime Time Jewelers		MD	20906
Prinsu		AL	
Procare Medical Company		AL	
Progress Mobility	Stanton	AL	90680
Quality Furniture & Appliance		TX	
Rambo Furniture Corp	Staten Island	NY	10305
Rana Furniture (Main Office)	Miami	FL	33172
Ray APPLIANCESs inc	Providence	RI	2905
Red Gate Home Furnishings	Ballground	GA	30107
Regal Mobility		AL	
Rescue Supply			
Rev 6		AL	
Revalue Fitness Equipment		AL	
RGB CustomPC, LLCC		TX	
RICKS	Tampa	FL	33592
Rico's Furniture Inc	Garland	TX	75217
RideOnRims		FL	
Rogers Furniture & Gifts	Vernon	AL	35592
Roses Flooring and Furniture (Dunn, 402)	Dunn	NC	28334
Roses Flooring and Furniture (Lumberton, 410)	Lumberton	NC	28358
Roses Flooring and Furniture (Oxford, 429)	Oxford	NC	27565
RR Racing Inc			
Rtbshopper	Sheridan	WY	82801
rws			
SaferWholesale.com		IL	
Salgado Tires (Acworth)	Acworth	GA	30101
Salgado Tires (Milton)	Alpharetta	GA	30004
Salinas Tires	La Habra	CA	90631
Salvage World (Hattiesburg)	Hattiesburg	MS	39401
Salvage World - Hattiesburg - Broadway	Hattiesburg	MS	39401
Saslow's Blue Ridge Mall	Hendersonville	NC	28792-2867
Saslow's Boone Mall	Boone	NC	28607-4883
Saslow's Fayetteville	Fayetteville	NC	28303-7271
Saslow's Henderson	Henderson	NC	27536-2963
Saslow's Heritage Crossing Shopping Ctr	Wilson	NC	27896-8222
Saslow's Home Office	Greensboro	NC	27415-4189
Saslow's Monroe Mall	Monroe	NC	28110-2737
Saslow's Norton	Norton	VA	24273
Saslow's Southgate Park	Elizabeth City	NC	27909-4499
Saslow's Valley Hills Mall	Hickory	NC	28602-5097
Scooter Factory			
Scooter Importer		AL	
Scooters Plus		AL	
Scooter Supermarket			
Shirin Diamond Center	Houston	TX	77075
Shoman Furniture	Bronx	NY	10467
Shopcwo.com		AL	
ShopEZCredit		AL	
Simple Tronics	Mission	TX	78572
Skeps	Test	FL	33612
Smart Etailer			
SmokerBuilder		AZ	
Sneed Speed Shop		AL	
Sound On Wheels		AL	
Speedzone Performance		FL	
Sprylyfe		AL	
SS Solutions LLC dba: Sleep King (ABQ) 	Tampa	FL	33592
Star Furniture	Jackson	MS	39211
Starline Offroad Kustomz			
Stell Furniture	Boutte	LA	70039
Stephanie’s Scooter Shop		FL	
Stereo 1 (Northridge)	Northridge	CA	91324
Steve's Lawnmowers		PA	
Storage Sheds		FL	
storis			
Streetside Scooter & Powersports		AL	
Studz Racing			
Subimods		AL	
SuperJeweler.com		AL	
Super Llantas	Phoenix	AZ	85043
Super PowerSports		AL	
SURPLUS FURNITURE & MATTRESS WAREHOUSE	Selden	NY	11784
Sweet Home Furniture	Berlin	NJ	8009
Sweet Home Furniture	Framingham	MA	1702
Sweetpay	Tampa	FL	33612
Sweetpay_T1	Miami	FL	33612
Sweetpay_T2	Tampa	FL	33612
Swisher Aquisition		AL	
Synchrony	Tampa	FL	33592
Tamayo’s Jewelry Inc		TX	
Ten 2 Ten stereo	Azusa	CA	91702
TenPoint Crossbows		AL	
terraceFinance	Henderson	NV	89052
Testing	Hayward	CA	94542
Test Merchant JB	Tampa	FL	33612
Texan Mattress		TX	
Texan Mattress Cleveland		TX	
Texan Mattress (Huntsville)		TX	
Texan Mattress Magnolia		TX	
Texan Mattress Outlet		TX	
Texans Tire and Wheel Shop		TX	
Texans Tires And More LLC	Corpus Christi	TX	78408
Texas Furniture Clearance	Magnolia	TX	77354
The Best Deal Furniture #2	Dallas	TX	75208
The Closeout Store	Palm Springs	FL	33461
THE FURNITURE DEAL	Visalia	CA	93277
The Mattress Room by Alex Figueroa		TX	
The True Gem		TX	
Tiger Powersports		GA	
Tire Agent	Hayward	NC	27009
Tire Agent-PT	Hayward	FL	94542
TireBros	San Diego	CA	92108
Tirebros24		AL	
TireBuyer	Stanton	AL	90680
Tire City Upcycle DO NOT USE		AL	
Tire City & Wheels	El Paso	TX	79904
Tire Discount		AL	
Tiremax of South Florida	Hialeah	FL	33016
TIRE PRO	Dallas	TX	75227
Tires and Engine Performance		AL	
Tire Wheels Direct		AL	
Tire & Wheel Zone		AL	
Titan Motorsports		FL	
TNT AutoSport		GA	
Top Dawg Electronics/Agricameras		TX	
Top Shelf Auto, LLC	Riviera Beach	FL	33407
Total Performance Solutions			
Trevino Appliance (Edinburg)		AL	
Trevino Appliance (N McAllen)		AL	
Trevino Appliance (Pharr)		AL	
Trevino Appliance (San Antonio)		AL	
Trevino Appliance (S McAllen)		AL	
Trevino Appliance (Weslaco)		AL	
Trick Chassis		AL	
Tropical Scooters & Motorcycles		AL	
Turbokits.com		AL	
Unclaimed Diamonds			
Universal Furniture LLC	Kenner	LA	70065
UOWNTRAIN	Newport beach	CA	92614
Uownvest	Hayward	CA	94542
Venta Furnishings (PT)		TX	
Veracity	Hayward	CA	94542
Veracity	Tampa	FL	33612
Veracity2	Hayward	CA	94542
Wagner Appliance Sales (Online)	Winston	NC	27101
Waldin Jewelers	Tampa	FL	33592
Walker's Hometown Store	Princeton	IN	47670
Wanaryd Motorcycle		AL	
Warehouse Furniture	Bronx	NY	10456
WC Powersports		FL	
weGetFinancing	Test City	AL	55555
Wheel And Tire Proz	Kent	WA	98032
Wheel Boss			
Wheel Concepts		AL	
Wheelfire		AL	
Wheels Below Retail		AL	
Wheels Boutique		FL	
Wheel Specialists		AL	
Wild Hogs (Deland)		FL	
Wild Hogs Scooters (Lake Mary)		FL	
Wild Hogs Scooters-Orlando		FL	
Wild Hogs Scooters (Winter Garden)		FL	
Wild Hogs Scooters (Winter Park)		FL	
Wireless10Top		TX	
Wyvern Creations		AL	
Xgamer PC			
XoticPC		AL	
Yesstore.club		FL	
Yuri Merchant01	Tampa	FL	33777
}

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Criei o fluxo R7.25.1.45.0_BugOnLocationFieldOverviewFilterDashboard_Ticket1131.feature para fazer o teste.
Tenho 4 cenários:
    Quando selecionar merchant deve exibir somente suas location
    Quando selecionar location deve exibir somente seus merchants
    Quando o merchant tem mais de um location com o nome igual, devemos exibir esse locator somente uma vez.

Temos que inserir um step no feature para selecionar valores em merchant e location, ja temos isso no projeto
<div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="merchant"><span id="react-select-7-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container css-1r2c2t"><div class="filter__placeholder css-1eozryt-placeholder-placeholder" id="react-select-7-placeholder">Merchant</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-7-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;" aria-describedby="react-select-7-placeholder"></div></div><div class="filter__indicators css-1wy0on6"><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div>
<div class="index-module_inputGroup__eRmEm index-module_inputField__border__R6vKz"><div class="d-flex align-items-center index-module_inputField__vx3j9 w-100 h-100 flex-column"><div class="w-100 index-module_formikInput__0-IuM css-b62m3t-container" id="location"><span id="react-select-8-live-region" class="css-7pg0cj-a11yText"></span><span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="css-7pg0cj-a11yText"></span><div class="filter__control css-1830nju-control"><div class="filter__value-container css-1r2c2t"><div class="filter__placeholder css-1eozryt-placeholder-placeholder" id="react-select-8-placeholder">location</div><div class="filter__input-container css-ackcql" data-value=""><input class="filter__input" autocapitalize="none" autocomplete="off" autocorrect="off" id="react-select-8-input" spellcheck="false" tabindex="0" type="text" aria-autocomplete="list" aria-expanded="false" aria-haspopup="true" role="combobox" value="" style="color: inherit; background: 0px center; opacity: 1; width: 100%; grid-area: 1 / 2; font: inherit; min-width: 2px; border: 0px; margin: 0px; outline: 0px; padding: 0px;" aria-describedby="react-select-8-placeholder"></div></div><div class="filter__indicators css-1wy0on6"><span class="filter__indicator-separator css-up21if-indicatorSeparator-indicatorSeparator"></span><div class="filter__indicator filter__dropdown-indicator css-dugssj-indicatorContainer-indicatorContainer" aria-hidden="true"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div></div>

Depois de selecionar o merchant/location, temos que conferir se a quantidade de registros é igual a quantidade de registros entregue na consulta ao banco de dados
Para contar quantas opcoes sao exibidas no autocomplete, podemos usar a estrutura que itera por todas as opcoes que ja temos no projeto
try {

            numberOfFormInlineElements = (long) Browser.js.executeScript("return document.getElementsByClassName(\"form-inline\").length;");

            desiredFormInlineIndex = (int) (numberOfFormInlineElements - 1);
            quickSearchRowClassName = (String) Browser.js.executeScript("return document.getElementsByClassName(\"form-inline\")[" + desiredFormInlineIndex + "].children[0].children[3].children[1].className;");
        } catch (Exception e_2) {
            CommonSteps.throwExceptionAndWriteToReport(customerId + " not found in quick search.");
            return;
        }

        if (!CommonHelpers.waitForElement(By.className(quickSearchRowClassName), 10, true)) {
            CommonSteps.throwExceptionAndWriteToReport(customerId + " not found in quick search.");
        }

        CommonHelpers.waitForElement(By.className(quickSearchRowClassName), 10, true);

        Thread.sleep(1500);
        long numberOfReturnedOptions;
        try {
            numberOfReturnedOptions = (long) Browser.js.executeScript("return document.getElementsByClassName(\"" + quickSearchRowClassName + "\").length;");
        } catch (org.openqa.selenium.JavascriptException e) {
            numberOfReturnedOptions = 0;
        }
        if (numberOfReturnedOptions == 0) {
            CommonSteps.throwExceptionAndWriteToReport(customerId + " not found in quick search.");
        }

        String id;

        for (int i = 0; i < numberOfReturnedOptions; i++) {

            CommonSteps.presentationDelay(DELAY_MEDIUM_MS);
            try {
                id = (String) Browser.js.executeScript("return document.getElementsByClassName(\"" + quickSearchRowClassName + "\")[" + i + "].children[0].children[0].children[3].innerText;");
            } catch (org.openqa.selenium.JavascriptException e) {
                CommonSteps.throwExceptionAndWriteToReport("Quick search did not populate");
                return;
            }

            if (id.equals(customerId)) {
                ElementUtility.clickButtonByIterable(By.className(quickSearchRowClassName), Integer.parseInt(String.valueOf(i)), false);
                CommonHelpers.checkPageTransition(10, "customers", false);
                CommonSteps.presentationDelay(DELAY_LARGE_MS);
                if (getAccountPk) {


                    getAccountIdentifications();
                }
                return;
            }

        }

Depois de selecionar a merchant/location e contar quantas opcoes sao exibidas temos que armazenar quantas opcoes e quais sao porque temos cenários que verifica quantidade e nome.

Depois de armazenar a quantidade e nome das opcoes, vamos ao banco de dados fazer a consulta e guardamos quantidade e nome(legal_name) dos resultados encontrados.

Depois criamos um step para cada validação necessaria para ficar bem descrito no feature. Iremos criar validação para verificar a quantidade de registros e se esta exibindo registros iguais(duplicados)

Insira os steps no arquivo feature R7.25.1.45.0_BugOnLocationFieldOverviewFilterDashboard_Ticket1131


Cenários:
Quando selecionar merchant deve exibir somente suas location
    Aqui estou selecionando Saslow's Jewelers, entao os location que devem exibidos no filtro location sao:
    select um.location_name ,um.merchant_name ,um.legal_name ,um.is_active,um.is_deleted,um.ref_merchant_code ,um.* from Uown_merchant um  
    where 
    is_active = true 
    AND (is_deleted = false OR is_deleted IS NULL)
    and um.legal_name like '%Saslow''s Jewelers%' 
    order by um.pk desc
    ;
    Saslow's Home Office
    Saslow's Home Office
    Saslow's Norton
    Saslow's Blue Ridge Mall
    Saslow's Southgate Park
    Saslow's Boone Mall
    Saslow's Monroe Mall
    Saslow's Heritage Crossing Shopping Ctr
    Saslow's Fayetteville
    Saslow's Henderson
    Saslow's Home Office
    select um.location_name  from Uown_merchant um  
    where 
    is_active = true 
    AND (is_deleted = false OR is_deleted IS NULL)
    and um.legal_name like '%Saslow''s Jewelers%' 
    order by um.pk desc
    ;

Quando selecionar location deve exibir somente seus merchants
    Aqui estou selecionando o location Saslow's Home Office, então devemos exibir somente os merchants relacionados ao location:
    select um.location_name ,um.merchant_name,um.legal_name  ,um.is_active,um.is_deleted,um.ref_merchant_code ,um.* from Uown_merchant um  
    where 
    is_active = true 
    AND (is_deleted = false OR is_deleted IS NULL)
    and um.location_name = 'Saslow''s Home Office' 
    order by um.pk desc
    ;
    Saslow's Home Office
    Saslow's Home Office
    Saslow's Home Office
    select um.location_name
    from Uown_merchant um  
    where 
    is_active = true 
    AND (is_deleted = false OR is_deleted IS NULL)
    and um.location_name = 'Saslow''s Home Office' 
    order by um.pk desc
    ;

Quando o merchant tem mais de um location com o nome igual, devemos exibir esse locator somente uma vez.
    Aqui estou selecionando Progress Mobility Acquisition LLC que tem 3 location "Progress Mobility"
    select um.location_name ,um.merchant_name ,um.legal_name ,um.is_active,um.is_deleted,um.ref_merchant_code ,um.* from Uown_merchant um  
    where 
    is_active = true 
    AND (is_deleted = false OR is_deleted IS NULL)
    and um.legal_name like '%Progress Mobility Acquisition LLC%' 
    order by um.pk desc
    ;
    Progress Mobility
    Progress Mobility
    Progress Mobility
    Devemos exibir o location somente uma vez porque são iguais
    select um.location_name  from Uown_merchant um  
    where 
    is_active = true 
    AND (is_deleted = false OR is_deleted IS NULL)
    and um.legal_name like '%Progress Mobility Acquisition LLC%' 
    order by um.pk desc
    ;

-----



Ao selecionar um comerciante, mostrar apenas suas localizações e acionar getLocationNamesByMerchant;
Ao selecionar uma localização, mostrar apenas os comerciantes correspondentes; --> OK
Remover duplicados (mesmo nome de localização ou mesmo ref_merchant_code do comerciante); --> location > multiplos merchants OK - merchant > multiplos locations OK
Evitar a seleção de localizações que não estejam relacionadas ao comerciante selecionado.
---
When selecting a merchant, show only its locations and trigger getLocationNamesByMerchant;
When selecting a location, show only its merchants;
Remove duplicates (same location name or same merchant ref_merchant_code);
Prevent selecting locations that are not related to the selected merchant.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




> ```gherkin
> Given I am on the identity verification process for a merchant
>
> ### Scenario: Only SEON is configured and the record exists
>
>
> | PASS | LeadPk: | AccountPk: | Merchant: | 
> ```
>
>

> ## Tests in qa1

> - When selecting a merchant, show only its locations and trigger getLocationNamesByMerchant;
> - When selecting a location, show only its merchants;
> - Remove duplicates (same location name or same merchant ref_merchant_code);
> - Prevent selecting locations that are not related to the selected merchant.
>
> | PASS |
> ```
>
>

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

voce consegue revisar o codigo que tenho de alteração?
antes de dar commit tenho que revisar o que tenho de alteracao para:
Nunca use a primeira pessoa nos cenários de teste; descreva apenas o comportamento.
Em steps do Cucumber, use Cucumber Expressions puras.
Comece cada descrição com a primeira letra maiúscula.
Metodos que contem consulta ao banco devem ficar em @DatabaseHelpers.java 
Steps que contem consulta ao banco devem ficar em @DatabaseSteps.java 
Metodos que contem relacao com api devem ficar em  @ApiClient.java 
Steps que contem relacao com api devem ficar em @ApiSteps.java
Centralizar a interação com os elementos da UI em Elements.java.
Evite o uso de try catch onde não é necessário, não sugira somente a inserão de try catch para solucionar erros.
Capture exceções específicas e evite catch (Exception ignored).
Prefira wait.until a Thread.sleep, exceto em casos de polling de backend.
Antes de criar novos steps e métodos, revise os steps e métodos presentes dentro das pastas:
legacy-project/ui_automation\src\test\java\com\fintech\uiautomation\stepdefinitions
legacy-project/ui_automation\src\test\java\com\fintech\uiautomation\uownpages


Após criar um novo step ou metodo, revise seu escopo e o escopo onde ele será usado verificando se o novo código está correto e se não há outro step ou método com a mesma funcionalidade:
legacy-project/ui_automation\src\test\java\com\fintech\uiautomation\stepdefinitions
legacy-project/ui_automation\src\test\java\com\fintech\uiautomation\uownpages
Remova todos os comentários desnecessários.
Mensagens de log e System.out.println sempre em inglês.
Siga o Page Object Model e design patterns para garantir testabilidade e manutenção.



o que acha de incluir no nosso lint se nao tiver incluido?

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.25.1.45.0_BugOnLocationFieldOverviewFilterDashboard_Ticket1131

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Pode exibir location inativo? Estamos exibindo.
Pode exibir location deletado? Estamos exibindo.
Pode exibir merchant inativo? Estamos exibindo.
Pode exibir merchant deletado? Estamos exibindo.
